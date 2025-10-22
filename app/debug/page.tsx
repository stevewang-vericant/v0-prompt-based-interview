'use client'

import { useState } from 'react'

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  const testAPI = async () => {
    setIsLoading(true)
    addLog('Testing /api/test endpoint...')
    
    try {
      const response = await fetch('/api/test')
      const data = await response.json()
      addLog(`Test API response: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      addLog(`Test API error: ${error}`)
    }
    
    setIsLoading(false)
  }

  const testMergeAPI = async () => {
    setIsLoading(true)
    addLog('Testing /api/merge-videos endpoint...')
    
    try {
      const testData = {
        interviewId: 'test-interview-123',
        segments: [
          { url: 'https://f001.backblazeb2.com/file/v0-interview-videos/test-video1.mp4', duration: 5 },
          { url: 'https://f001.backblazeb2.com/file/v0-interview-videos/test-video2.mp4', duration: 5 }
        ]
      }
      
      addLog(`Sending test data: ${JSON.stringify(testData, null, 2)}`)
      
      const response = await fetch('/api/merge-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      })
      
      const responseText = await response.text()
      addLog(`Merge API response status: ${response.status}`)
      addLog(`Merge API response: ${responseText}`)
      
    } catch (error) {
      addLog(`Merge API error: ${error}`)
    }
    
    setIsLoading(false)
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Page</h1>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={testAPI}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test API
        </button>
        
        <button 
          onClick={testMergeAPI}
          disabled={isLoading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50 ml-4"
        >
          Test Merge API
        </button>
        
        <button 
          onClick={clearLogs}
          className="bg-red-500 text-white px-4 py-2 rounded ml-4"
        >
          Clear Logs
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Debug Logs:</h2>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="text-sm font-mono">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
