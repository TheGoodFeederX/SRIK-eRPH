import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Step {
    step: number;
    label: string;
}

interface WizardStepperProps {
    steps: Step[];
    currentStep: number;
    onStepClick?: (step: number) => void;
}

export const WizardStepper: React.FC<WizardStepperProps> = ({ steps, currentStep, onStepClick }) => {
    return (
        <nav className="relative mb-10 px-2" aria-label="Progress">
            <div className="flex justify-between items-center relative">
                {/* Progress Bar Background */}
                <div 
                    className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2" 
                    style={{ zIndex: 0 }}
                />
                
                {/* Active Progress Bar */}
                <motion.div 
                    className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    style={{ zIndex: 0, backgroundColor: 'var(--primary)', transformOrigin: 'left' }}
                />

                {steps.map((s) => {
                    const isCompleted = currentStep > s.step;
                    const isActive = currentStep === s.step;
                    
                    return (
                        <div 
                            key={s.step} 
                            className="flex flex-col items-center gap-2 relative z-10"
                        >
                            <button
                                type="button"
                                onClick={() => onStepClick?.(s.step)}
                                disabled={!onStepClick || (!isCompleted && !isActive)}
                                aria-current={isActive ? 'step' : undefined}
                                className={`
                                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                                    transition-all duration-300 border-2
                                    ${isCompleted ? 'bg-primary border-primary text-white shadow-lg' : 
                                      isActive ? 'bg-white border-primary text-primary shadow-md scale-110' : 
                                      'bg-white border-slate-200 text-slate-400'}
                                `}
                                style={{ 
                                    backgroundColor: isCompleted ? 'var(--primary)' : 'white',
                                    borderColor: (isCompleted || isActive) ? 'var(--primary)' : 'var(--border)',
                                    color: isCompleted ? 'white' : isActive ? 'var(--primary)' : 'var(--text-muted)'
                                }}
                            >
                                {isCompleted ? <Check size={20} strokeWidth={3} /> : s.step}
                            </button>
                            <span 
                                className={`text-xs font-semibold whitespace-nowrap transition-colors duration-300
                                    ${isActive ? 'text-primary' : 'text-slate-500'}
                                `}
                                style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }}
                            >
                                {s.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </nav>
    );
};
