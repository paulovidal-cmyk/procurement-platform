import { Check } from 'lucide-react'
import { cn } from '../../utils/cn.js'

const STEPS = [
  { number: 1, label: 'Fornecedor', sublabel: 'CNPJ e dados' },
  { number: 2, label: 'Financeiro', sublabel: 'Valores e saving' },
  { number: 3, label: 'Análise', sublabel: 'VPL e justificativa' },
]

export function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0 px-6 py-4 bg-gray-50 border-b border-gray-200">
      {STEPS.map((step, idx) => {
        const isCompleted = currentStep > step.number
        const isActive = currentStep === step.number

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                  isCompleted && 'bg-emerald-500 text-white',
                  isActive && 'bg-blue-600 text-white ring-4 ring-blue-100',
                  !isCompleted && !isActive && 'bg-gray-200 text-gray-500'
                )}
              >
                {isCompleted ? <Check size={16} /> : step.number}
              </div>
              <div className="mt-1 text-center">
                <p className={cn('text-xs font-semibold', isActive ? 'text-blue-700' : 'text-gray-500')}>{step.label}</p>
                <p className="text-xs text-gray-400">{step.sublabel}</p>
              </div>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={cn('h-0.5 w-16 mx-2 mt-[-18px] transition-all', currentStep > step.number ? 'bg-emerald-400' : 'bg-gray-200')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
