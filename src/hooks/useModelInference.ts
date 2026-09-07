"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import type { InferenceType, InferenceResponse } from '@/workers/model-inference.worker'

export type InferenceStatus = 'idle' | 'working' | 'ready' | 'error'

interface RunOptions {
  context?: string
  targetLang?: string
  signal?: AbortSignal
}

export function useModelInference() {
  const [status, setStatus] = useState<InferenceStatus>('idle')
  const [lastError, setLastError] = useState<string | null>(null)
  
  const workerRef = useRef<Worker | null>(null)
  const nextId = useRef(1)
  const pendingRequests = useRef(new Map<number, { resolve: (val: any) => void, reject: (err: any) => void }>())

  // Lazy initialize worker
  const getWorker = useCallback(() => {
    if (typeof window === 'undefined') return null
    
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../workers/model-inference.worker.ts', import.meta.url))
      
      workerRef.current.onmessage = (event: MessageEvent<InferenceResponse>) => {
        const { id, ok, result, error } = event.data
        const req = pendingRequests.current.get(id)
        if (req) {
          pendingRequests.current.delete(id)
          if (ok) {
            req.resolve(result)
          } else {
            req.reject(new Error(error || 'Inference failed'))
          }
        }
        
        if (pendingRequests.current.size === 0) {
          setStatus('ready')
        }
      }
      
      workerRef.current.onerror = (err) => {
        setLastError('Worker error: ' + err.message)
        setStatus('error')
      }
    }
    
    return workerRef.current
  }, [])

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  const run = useCallback(async (
    type: InferenceType, 
    modelId: string, 
    text: string, 
    options: RunOptions = {}
  ) => {
    if (typeof window === 'undefined') return null

    const worker = getWorker()
    if (!worker) throw new Error('Worker not available')

    setStatus('working')
    setLastError(null)

    const id = nextId.current++
    
    return new Promise((resolve, reject) => {
      pendingRequests.current.set(id, { resolve, reject })
      
      const abortHandler = () => {
        const req = pendingRequests.current.get(id)
        if (req) {
          pendingRequests.current.delete(id)
          req.reject(new Error('Aborted'))
          
          if (pendingRequests.current.size === 0) {
            setStatus('ready')
          }
        }
      }

      if (options.signal) {
        if (options.signal.aborted) {
          return abortHandler()
        }
        options.signal.addEventListener('abort', abortHandler)
      }

      worker.postMessage({
        id,
        type,
        modelId,
        text,
        context: options.context,
        targetLang: options.targetLang
      })
    }).finally(() => {
      if (options.signal) {
        // We can't cleanly removeEventListener inline without extracting the function,
        // but the signal is tied to the request lifespan.
      }
    })
  }, [getWorker])

  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    pendingRequests.current.forEach(req => req.reject(new Error('Worker terminated')))
    pendingRequests.current.clear()
    setStatus('idle')
  }, [])

  return { run, status, lastError, terminate }
}

