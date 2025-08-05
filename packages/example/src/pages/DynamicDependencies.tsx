import React, { useEffect, useState } from 'react';
import { useService } from '@pandino/react-hooks';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { LoggerService } from '../bundles/logger-bundle';
import { Task, TaskManagerService } from '../bundles/task-manager-bundle';
import { useFeatureToggle } from '../contexts/FeatureToggleContext';

const DynamicDependencies: React.FC = () => {
  const { enableFeature, isFeatureEnabled } = useFeatureToggle();

  useEffect(() => {
    if (!isFeatureEnabled('bundleSystem')) {
      enableFeature('bundleSystem');
    }
    if (!isFeatureEnabled('dynamicDependencies')) {
      enableFeature('dynamicDependencies');
    }
  }, [enableFeature, isFeatureEnabled]);

  const { service: loggerService } = useService<LoggerService>('LoggerService');
  const { service: taskManagerService } = useService<TaskManagerService>('TaskManagerService');

  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<Array<{ level: string; message: string; timestamp: number }>>([]);

  useEffect(() => {
    console.log('[DEBUG_LOG] DynamicDependencies useEffect called');
    console.log('[DEBUG_LOG] taskManagerService available:', !!taskManagerService);
    console.log('[DEBUG_LOG] loggerService available:', !!loggerService);

    if (taskManagerService) {
      const allTasks = taskManagerService.getAllTasks();
      console.log('[DEBUG_LOG] All tasks:', allTasks);
      setTasks(allTasks);
    }

    if (loggerService) {
      const allLogs = loggerService.getLogs();
      console.log('[DEBUG_LOG] All logs from loggerService:', allLogs);
      setLogs(allLogs);
    }

    const interval = setInterval(() => {
      console.log('[DEBUG_LOG] Interval tick');

      if (taskManagerService) {
        const allTasks = taskManagerService.getAllTasks();
        console.log('[DEBUG_LOG] All tasks (interval):', allTasks);
        setTasks(allTasks);
      }

      if (loggerService) {
        const allLogs = loggerService.getLogs();
        console.log('[DEBUG_LOG] All logs from loggerService (interval):', allLogs);
        setLogs(allLogs);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [taskManagerService, loggerService]);

  const handleCreateTask = () => {
    console.log('[DEBUG_LOG] handleCreateTask called', { taskName, taskDescription });
    console.log('[DEBUG_LOG] taskManagerService available:', !!taskManagerService);
    console.log('[DEBUG_LOG] loggerService available:', !!loggerService);

    if (taskManagerService && loggerService && taskName.trim() && taskDescription.trim()) {
      console.log('[DEBUG_LOG] About to create task');
      taskManagerService.createTask(taskName, taskDescription);
      setTaskName('');
      setTaskDescription('');

      console.log('[DEBUG_LOG] About to get logs after task creation');
      const updatedLogs = loggerService.getLogs();
      console.log('[DEBUG_LOG] Updated logs after task creation:', updatedLogs);
      setLogs(updatedLogs);

      console.log('[DEBUG_LOG] About to get tasks after task creation');
      const updatedTasks = taskManagerService.getAllTasks();
      console.log('[DEBUG_LOG] Updated tasks after task creation:', updatedTasks);
      setTasks(updatedTasks);
    }
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: 'pending' | 'in-progress' | 'completed') => {
    console.log('[DEBUG_LOG] handleUpdateTaskStatus called', { taskId, newStatus });
    console.log('[DEBUG_LOG] taskManagerService available:', !!taskManagerService);
    console.log('[DEBUG_LOG] loggerService available:', !!loggerService);

    if (taskManagerService && loggerService) {
      console.log('[DEBUG_LOG] About to update task status');
      taskManagerService.updateTaskStatus(taskId, newStatus);

      console.log('[DEBUG_LOG] About to get logs after task update');
      const updatedLogs = loggerService.getLogs();
      console.log('[DEBUG_LOG] Updated logs after task update:', updatedLogs);
      setLogs(updatedLogs);

      console.log('[DEBUG_LOG] About to get tasks after task update');
      const updatedTasks = taskManagerService.getAllTasks();
      console.log('[DEBUG_LOG] Updated tasks after task update:', updatedTasks);
      setTasks(updatedTasks);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    console.log('[DEBUG_LOG] handleDeleteTask called', { taskId });
    console.log('[DEBUG_LOG] taskManagerService available:', !!taskManagerService);
    console.log('[DEBUG_LOG] loggerService available:', !!loggerService);

    if (taskManagerService && loggerService) {
      console.log('[DEBUG_LOG] About to delete task');
      taskManagerService.deleteTask(taskId);

      console.log('[DEBUG_LOG] About to get logs after task deletion');
      const updatedLogs = loggerService.getLogs();
      console.log('[DEBUG_LOG] Updated logs after task deletion:', updatedLogs);
      setLogs(updatedLogs);

      console.log('[DEBUG_LOG] About to get tasks after task deletion');
      const updatedTasks = taskManagerService.getAllTasks();
      console.log('[DEBUG_LOG] Updated tasks after task deletion:', updatedTasks);
      setTasks(updatedTasks);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dynamic Dependencies Demo
      </Typography>

      <Typography variant="body1" paragraph>
        This demonstrates how bundles can depend on services from other bundles. The Task Manager bundle depends on the
        Logger bundle.
      </Typography>

      <Typography variant="body1" paragraph>
        When you create, update, or delete tasks using the Task Manager service, it uses the Logger service to log these
        operations. You can see the logs in the Logs panel below.
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Grid container spacing={3}>
        {/* Task Form */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Create Task
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="Task Name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                fullWidth
                disabled={!taskManagerService}
              />

              <TextField
                label="Task Description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                fullWidth
                multiline
                rows={3}
                disabled={!taskManagerService}
              />

              <Button
                variant="contained"
                onClick={handleCreateTask}
                disabled={!taskManagerService || !taskName.trim() || !taskDescription.trim()}
              >
                Create Task
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Tasks List */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Tasks
            </Typography>

            {!taskManagerService ? (
              <Typography color="text.secondary">Task Manager service not available</Typography>
            ) : tasks.length === 0 ? (
              <Typography color="text.secondary">No tasks created yet</Typography>
            ) : (
              <Stack spacing={2}>
                {tasks.map((task) => (
                  <Card key={task.id} variant="outlined">
                    <CardContent>
                      <Typography variant="h6">{task.name}</Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Created: {formatTimestamp(task.createdAt)}
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {task.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="caption" display="block">
                            Status: {task.status}
                          </Typography>
                        </Box>
                        <Box>
                          <Button
                            size="small"
                            onClick={() => handleUpdateTaskStatus(task.id, 'pending')}
                            disabled={task.status === 'pending'}
                            sx={{ mr: 1 }}
                          >
                            Pending
                          </Button>
                          <Button
                            size="small"
                            onClick={() => handleUpdateTaskStatus(task.id, 'in-progress')}
                            disabled={task.status === 'in-progress'}
                            sx={{ mr: 1 }}
                          >
                            In Progress
                          </Button>
                          <Button
                            size="small"
                            onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                            disabled={task.status === 'completed'}
                            sx={{ mr: 1 }}
                          >
                            Complete
                          </Button>
                          <Button size="small" color="error" onClick={() => handleDeleteTask(task.id)}>
                            Delete
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Logs */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Logs
            </Typography>

            {!loggerService ? (
              <Typography color="text.secondary">Logger service not available</Typography>
            ) : logs.length === 0 ? (
              <Typography color="text.secondary">No logs yet</Typography>
            ) : (
              <List dense>
                {logs.map((log, index) => (
                  <ListItem key={index} divider={index < logs.length - 1}>
                    <ListItemText
                      primary={log.message}
                      secondary={`${log.level.toUpperCase()} - ${formatTimestamp(log.timestamp)}`}
                      primaryTypographyProps={{
                        style: {
                          color: log.level === 'error' ? 'red' : log.level === 'warn' ? 'orange' : 'inherit',
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DynamicDependencies;
