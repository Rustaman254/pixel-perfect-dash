import { useState, useEffect } from 'react';
import { Check, X, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
}

interface OnboardingOverlayProps {
  tasks: OnboardingTask[];
  onComplete: () => void;
  onClose: () => void;
}

export default function OnboardingOverlay({ tasks, onComplete, onClose }: OnboardingOverlayProps) {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    const completed = tasks.filter(t => t.completed).map(t => t.id);
    setCompletedTasks(new Set(completed));
  }, [tasks]);

  const allCompleted = tasks.every(t => completedTasks.has(t.id));

  const handleComplete = async () => {
    setIsCompleting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onComplete();
  };

  const handleTaskClick = (task: OnboardingTask) => {
    if (task.action) {
      task.action();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-[#0A0A0A]">Setup Your Store</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <p className="text-sm text-gray-500">Complete these steps to launch your online store</p>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-medium mb-2">
              <span className="text-gray-500">Progress</span>
              <span className="text-[#0A0A0A]">{completedTasks.size} / {tasks.length}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#D4F655] transition-all duration-500 ease-out"
                style={{ width: `${(completedTasks.size / tasks.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          <div className="space-y-2">
            {tasks.map((task, index) => {
              const isCompleted = completedTasks.has(task.id);
              return (
                <button
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group",
                    isCompleted 
                      ? "bg-green-50 border-green-200" 
                      : "bg-white border-gray-200 hover:border-[#D4F655] hover:shadow-sm"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all",
                    isCompleted 
                      ? "bg-green-500 text-white" 
                      : "bg-gray-100 text-gray-400 group-hover:bg-[#D4F655] group-hover:text-[#0A0A0A]"
                  )}>
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-bold text-sm",
                      isCompleted ? "text-green-700" : "text-[#0A0A0A]"
                    )}>
                      {task.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>
                  </div>
                  
                  {task.action && (
                    <ChevronRight className={cn(
                      "w-5 h-5 shrink-0 transition-transform",
                      isCompleted ? "text-green-500" : "text-gray-400 group-hover:text-[#0A0A0A] group-hover:translate-x-1"
                    )} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          {allCompleted ? (
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className="w-full py-3.5 bg-[#D4F655] hover:bg-[#c1e547] text-[#0A0A0A] font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Finishing up...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Complete Setup
                </>
              )}
            </button>
          ) : (
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-3">
                Complete all tasks to see your store overview
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-[#0A0A0A] font-bold rounded-xl transition-all"
              >
                Continue Editing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
