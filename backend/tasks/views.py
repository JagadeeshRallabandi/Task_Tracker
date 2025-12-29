from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Task, TaskDependency
from .serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def perform_update(self, serializer):
        task = serializer.save()
        self.update_dependent_tasks(task)

    def update_dependent_tasks(self, task):
        # Rule: If task is completed, check tasks that depend on it
        if task.status == 'completed':
            # Find tasks that depend on THIS task
            blocking_tasks = Task.objects.filter(dependencies__depends_on=task)
            for t in blocking_tasks:
                self.check_and_update_status(t)

    def check_and_update_status(self, task):
        dependencies = task.dependencies.all()
        if not dependencies.exists():
            return

        all_completed = True
        any_blocked = False

        for dep in dependencies:
            if dep.depends_on.status == 'blocked':
                any_blocked = True
            if dep.depends_on.status != 'completed':
                all_completed = False
        
        new_status = task.status
        if any_blocked:
            new_status = 'blocked'
        elif all_completed:
            new_status = 'in_progress'
        
        if new_status != task.status:
            task.status = new_status
            task.save()
            # Recursively update tasks depending on this one
            self.update_dependent_tasks(task)

    @action(detail=True, methods=['post'])
    def add_dependency(self, request, pk=None):
        task = self.get_object()
        depends_on_id = request.data.get('depends_on_id')
        
        try:
            depends_on_task = Task.objects.get(id=depends_on_id)
        except Task.DoesNotExist:
            return Response({"error": "Dependency task not found"}, status=404)

        # 1. Self dependency check
        if task.id == depends_on_task.id:
            return Response({"error": "Cannot depend on self"}, status=400)

        # 2. Circular Dependency Detection (DFS)
        is_circular, path = self.detect_cycle(task.id, depends_on_task.id)
        if is_circular:
            return Response({
                "error": "Circular dependency detected",
                "path": path
            }, status=400)

        TaskDependency.objects.create(task=task, depends_on=depends_on_task)
        
        # Check status after adding dependency (might become pending if it was in_progress)
        self.check_and_update_status(task)
        
        return Response({"status": "dependency added"})

    def detect_cycle(self, source_id, target_id):
        """
        Check if adding link source -> target creates a cycle.
        We do this by checking if there is ALREADY a path from target -> source.
        """
        visited = set()
        stack = [(target_id, [target_id])] # (current_node, path)

        while stack:
            curr, path = stack.pop()
            if curr == source_id:
                return True, path + [source_id]
            
            if curr in visited:
                continue
            visited.add(curr)

            # Get all tasks that 'curr' depends on
            # Actually, to find path target->source, we need to traverse:
            # If we add A->B, we check if B can reach A.
            # So we follow B's existing dependencies.
            deps = TaskDependency.objects.filter(task_id=curr)
            for dep in deps:
                stack.append((dep.depends_on.id, path + [dep.depends_on.id]))
        
        return False, []