/**
 * IndexedDB 工具库
 * 用于持久化存储视频片段，支持断点续传
 */

const DB_NAME = 'interview-videos'
const DB_VERSION = 1
const STORE_NAME = 'video-segments'

export interface VideoSegment {
  id: string // 格式: {interviewId}-{promptId}
  interviewId: string
  promptId: string
  sequenceNumber: number
  blob: Blob
  questionText: string
  category: string
  responseTime: number
  timestamp: number
  uploaded: boolean
  uploadedUrl?: string
  uploadedAt?: number
}

/**
 * 打开数据库
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error}`))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // 创建对象存储（如果不存在）
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        
        // 创建索引
        store.createIndex('interviewId', 'interviewId', { unique: false })
        store.createIndex('uploaded', 'uploaded', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

/**
 * 保存视频片段到 IndexedDB
 */
export async function saveVideoSegment(
  interviewId: string,
  promptId: string,
  sequenceNumber: number,
  blob: Blob,
  questionText: string,
  category: string,
  responseTime: number
): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const segment: VideoSegment = {
      id: `${interviewId}-${promptId}`,
      interviewId,
      promptId,
      sequenceNumber,
      blob,
      questionText,
      category,
      responseTime,
      timestamp: Date.now(),
      uploaded: false
    }

    await new Promise<void>((resolve, reject) => {
      const request = store.put(segment)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    console.log(`[IndexedDB] Saved segment: ${segment.id}`)
  } catch (error) {
    console.error('[IndexedDB] Failed to save segment:', error)
    throw error
  }
}

/**
 * 获取指定面试的所有未上传片段
 */
export async function getPendingSegments(interviewId: string): Promise<VideoSegment[]> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('interviewId')

    return new Promise((resolve, reject) => {
      const request = index.getAll(interviewId)
      request.onsuccess = () => {
        const segments = (request.result as VideoSegment[])
          .filter(seg => !seg.uploaded)
          .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
        console.log(`[IndexedDB] Found ${segments.length} pending segments for ${interviewId}`)
        resolve(segments)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('[IndexedDB] Failed to get pending segments:', error)
    return []
  }
}

/**
 * 获取指定面试的所有片段（包括已上传的）
 */
export async function getAllSegments(interviewId: string): Promise<VideoSegment[]> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('interviewId')

    return new Promise((resolve, reject) => {
      const request = index.getAll(interviewId)
      request.onsuccess = () => {
        const segments = (request.result as VideoSegment[])
          .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
        console.log(`[IndexedDB] Found ${segments.length} total segments for ${interviewId}`)
        resolve(segments)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('[IndexedDB] Failed to get all segments:', error)
    return []
  }
}

/**
 * 标记片段为已上传
 */
export async function markSegmentAsUploaded(
  interviewId: string,
  promptId: string,
  uploadedUrl: string
): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const id = `${interviewId}-${promptId}`
    const getRequest = store.get(id)

    await new Promise<void>((resolve, reject) => {
      getRequest.onsuccess = () => {
        const segment = getRequest.result as VideoSegment
        if (segment) {
          segment.uploaded = true
          segment.uploadedUrl = uploadedUrl
          segment.uploadedAt = Date.now()
          
          const putRequest = store.put(segment)
          putRequest.onsuccess = () => {
            console.log(`[IndexedDB] Marked segment as uploaded: ${id}`)
            resolve()
          }
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve() // 如果找不到，也认为成功（可能已经被删除）
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  } catch (error) {
    console.error('[IndexedDB] Failed to mark segment as uploaded:', error)
    throw error
  }
}

/**
 * 删除指定面试的所有已上传片段
 */
export async function clearUploadedSegments(interviewId: string): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('interviewId')

    return new Promise((resolve, reject) => {
      const request = index.getAll(interviewId)
      request.onsuccess = () => {
        const segments = request.result as VideoSegment[]
        const deletePromises = segments
          .filter(seg => seg.uploaded)
          .map(seg => {
            return new Promise<void>((resolveDelete, rejectDelete) => {
              const deleteRequest = store.delete(seg.id)
              deleteRequest.onsuccess = () => resolveDelete()
              deleteRequest.onerror = () => rejectDelete(deleteRequest.error)
            })
          })

        Promise.all(deletePromises)
          .then(() => {
            console.log(`[IndexedDB] Cleared uploaded segments for ${interviewId}`)
            resolve()
          })
          .catch(reject)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('[IndexedDB] Failed to clear uploaded segments:', error)
    throw error
  }
}

/**
 * 删除指定面试的所有片段（包括未上传的）
 */
export async function clearAllSegments(interviewId: string): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('interviewId')

    return new Promise((resolve, reject) => {
      const request = index.getAll(interviewId)
      request.onsuccess = () => {
        const segments = request.result as VideoSegment[]
        const deletePromises = segments.map(seg => {
          return new Promise<void>((resolveDelete, rejectDelete) => {
            const deleteRequest = store.delete(seg.id)
            deleteRequest.onsuccess = () => resolveDelete()
            deleteRequest.onerror = () => rejectDelete(deleteRequest.error)
          })
        })

        Promise.all(deletePromises)
          .then(() => {
            console.log(`[IndexedDB] Cleared all segments for ${interviewId}`)
            resolve()
          })
          .catch(reject)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('[IndexedDB] Failed to clear all segments:', error)
    throw error
  }
}

/**
 * 检查是否有未完成的上传（用于页面加载时检测）
 */
export async function hasPendingUploads(interviewId: string): Promise<boolean> {
  try {
    const segments = await getPendingSegments(interviewId)
    return segments.length > 0
  } catch (error) {
    console.error('[IndexedDB] Failed to check pending uploads:', error)
    return false
  }
}

/**
 * 获取所有有未完成上传的面试ID列表
 */
export async function getInterviewsWithPendingUploads(): Promise<string[]> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('uploaded')

    return new Promise((resolve, reject) => {
      const request = index.getAll(false) // false = 未上传的
      request.onsuccess = () => {
        const segments = request.result as VideoSegment[]
        const interviewIds = [...new Set(segments.map(seg => seg.interviewId))]
        console.log(`[IndexedDB] Found ${interviewIds.length} interviews with pending uploads`)
        resolve(interviewIds)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('[IndexedDB] Failed to get interviews with pending uploads:', error)
    return []
  }
}

