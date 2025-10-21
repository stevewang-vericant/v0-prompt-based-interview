import { NextRequest, NextResponse } from 'next/server'

// 存储日志的内存数组（在生产环境中，这应该使用Redis或数据库）
let logs: Array<{
  id: string
  timestamp: string
  level: 'log' | 'error' | 'warn' | 'info'
  message: string
  source?: string
}> = []

// 重写console方法以捕获日志
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
}

function addLog(level: 'log' | 'error' | 'warn' | 'info', ...args: any[]) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ')
  
  const logEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    level,
    message,
    source: 'server'
  }
  
  logs.unshift(logEntry) // 最新的在前面
  
  // 只保留最近1000条日志
  if (logs.length > 1000) {
    logs = logs.slice(0, 1000)
  }
  
  // 调用原始console方法
  originalConsole[level](...args)
}

// 重写console方法
console.log = (...args: any[]) => addLog('log', ...args)
console.error = (...args: any[]) => addLog('error', ...args)
console.warn = (...args: any[]) => addLog('warn', ...args)
console.info = (...args: any[]) => addLog('info', ...args)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const since = searchParams.get('since')
  
  try {
    let filteredLogs = logs
    
    if (since) {
      const sinceTime = new Date(since).getTime()
      filteredLogs = logs.filter(log => new Date(log.timestamp).getTime() > sinceTime)
    }
    
    return NextResponse.json({
      success: true,
      logs: filteredLogs,
      total: logs.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE() {
  logs = []
  return NextResponse.json({
    success: true,
    message: 'Logs cleared'
  })
}
