// file: src/components/SubscribedApp.tsx
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import Queue from "../_pages/Queue"
import Solutions from "../_pages/Solutions"
import BehavioralAssistant from "../pages/BehavioralAssistant"
import { useToast } from "../contexts/toast"
import { ViewMode } from "../../src/types/electron.d.ts"

interface SubscribedAppProps {
  credits: number
  currentLanguage: string
  setLanguage: (language: string) => void
}

const SubscribedApp: React.FC<SubscribedAppProps> = ({
  credits,
  currentLanguage,
  setLanguage
}) => {
  const queryClient = useQueryClient()
  const [currentMode, setCurrentMode] = useState<ViewMode>('coding')
  const [codingSubView, setCodingSubView] = useState<'queue' | 'solutions'>('queue')
  const containerRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  useEffect(() => {
    const cleanup = window.electronAPI.onSetViewMode((mode) => {
      console.log(`Switching mode to: ${mode}`);
      setCurrentMode(mode);
      if (mode === 'coding') {
        setCodingSubView('queue');
      } else if (mode === 'behavioral') {
        // Reset or setup behavioral state here if needed
      } else if (mode === 'settings') {
        // Setup settings state if needed
      }
    });
    return cleanup;
  }, []);

  useEffect(() => {
    const cleanup = window.electronAPI.onResetView(() => {
      queryClient.invalidateQueries({ queryKey: ["screenshots"] })
      queryClient.invalidateQueries({ queryKey: ["problem_statement"] })
      queryClient.invalidateQueries({ queryKey: ["solution"] })
      queryClient.invalidateQueries({ queryKey: ["new_solution"] })
      setCurrentMode('coding')
      setCodingSubView('queue')
    })

    return cleanup
  }, [queryClient])

  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (!containerRef.current) return
      const height = containerRef.current.scrollHeight || 600
      const width = containerRef.current.scrollWidth || 800
      window.electronAPI?.updateContentDimensions({ width, height })
    }

    updateDimensions()
    
    const fallbackTimer = setTimeout(() => {
      window.electronAPI?.updateContentDimensions({ width: 800, height: 600 })
    }, 500)

    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(containerRef.current)

    const mutationObserver = new MutationObserver(updateDimensions)
    mutationObserver.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    })

    const delayedUpdate = setTimeout(updateDimensions, 1000)

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      clearTimeout(fallbackTimer)
      clearTimeout(delayedUpdate)
    }
  }, [currentMode, codingSubView])

  useEffect(() => {
    const cleanupFunctions = [
      window.electronAPI.onSolutionStart(() => {
        if (currentMode === 'coding') {
          setCodingSubView("solutions");
        }
      }),
      window.electronAPI.onUnauthorized(() => {
        queryClient.removeQueries({ queryKey: ["screenshots"] })
        queryClient.removeQueries({ queryKey: ["solution"] })
        queryClient.removeQueries({ queryKey: ["problem_statement"] })
        setCurrentMode('coding')
        setCodingSubView('queue')
      }),
      window.electronAPI.onProblemExtracted((data: any) => {
        if (currentMode === 'coding' && codingSubView === 'queue') {
          queryClient.invalidateQueries({ queryKey: ["problem_statement"] })
          queryClient.setQueryData(["problem_statement"], data)
        }
      }),
      window.electronAPI.onSolutionError((error: string) => {
        showToast("Error", error, "error")
      })
    ]
    return () => cleanupFunctions.forEach((fn) => fn())
  }, [currentMode, codingSubView, queryClient, showToast])

  return (
    <div ref={containerRef} className="min-h-0 flex flex-col flex-grow">
      {currentMode === 'coding' && (
        <>
          {codingSubView === 'queue' ? (
            <Queue
              setCodingSubView={setCodingSubView}
              credits={credits}
              currentLanguage={currentLanguage}
              setLanguage={setLanguage}
            />
          ) : codingSubView === 'solutions' ? (
            <Solutions
              setCodingSubView={setCodingSubView}
              credits={credits}
              currentLanguage={currentLanguage}
              setLanguage={setLanguage}
            />
          ) : null}
        </>
      )}
      {currentMode === 'behavioral' && (
        <BehavioralAssistant />
      )}
      {currentMode === 'settings' && (
        <div className="p-4 text-white">
          Settings View (Coming Soon)
        </div>
      )}
    </div>
  )
}

export default SubscribedApp
