'use client'

import { useState, useEffect, useRef } from 'react'

interface LogEntry {
  id: string
  timestamp: string
  level: 'log' | 'error' | 'warn' | 'info'
  message: string
  source?: string
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [lastFetch, setLastFetch] = useState<string | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const fetchLogs = async (since?: string) => {
    try {
      setIsLoading(true)
      const url = since ? `/api/logs?since=${since}` : '/api/logs'
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        if (since) {
          // 只添加新日志
          setLogs(prev => [...data.logs, ...prev])
        } else {
          // 替换所有日志
          setLogs(data.logs)
        }
        setLastFetch(data.timestamp)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearLogs = async () => {
    try {
      const response = await fetch('/api/logs', { method: 'DELETE' })
      const data = await response.json()
      
      if (data.success) {
        setLogs([])
        setLastFetch(null)
      }
    } catch (error) {
      console.error('Failed to clear logs:', error)
    }
  }

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 自动刷新
  useEffect(() => {
    if (!isAutoRefresh) return

    const interval = setInterval(() => {
      if (lastFetch) {
        fetchLogs(lastFetch)
      }
    }, 1000) // 每秒刷新

    return () => clearInterval(interval)
  }, [isAutoRefresh, lastFetch])

  // 初始加载
  useEffect(() => {
    fetchLogs()
  }, [])

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [logs])

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50'
      case 'warn': return 'text-yellow-600 bg-yellow-50'
      case 'info': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Server Logs</h1>
        <div className="space-x-2">
          <button
            onClick={() => fetchLogs()}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`px-4 py-2 rounded ${
              isAutoRefresh 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-300 text-gray-700'
            }`}
          >
            {isAutoRefresh ? 'Auto: ON' : 'Auto: OFF'}
          </button>
          <button
            onClick={clearLogs}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-gray-500">No logs yet. Start an interview to see logs here.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="mb-1">
              <span className="text-gray-500">
                [{formatTimestamp(log.timestamp)}]
              </span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${getLevelColor(log.level)}`}>
                {log.level.toUpperCase()}
              </span>
              <span className="ml-2">{log.message}</span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Total logs: {logs.length} | 
        Last update: {lastFetch ? formatTimestamp(lastFetch) : 'Never'} |
        Auto refresh: {isAutoRefresh ? 'ON' : 'OFF'}
      </div>
    </div>
  )
}
