'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { FileImage, UploadCloud, RefreshCcw } from 'lucide-react'

export default function KycUpload({
  userId,
  currentPath,
  onUploaded,
}: {
  userId: string
  currentPath?: string | null
  onUploaded: (path: string) => void
}) {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')

  // Create a short-lived signed URL for private preview
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!currentPath) {
        setPreviewUrl(null)
        return
      }

      const { data, error } = await supabase.storage
        .from('kyc')
        .createSignedUrl(currentPath, 60 * 5) // 5 min

      if (cancelled) return
      if (error) {
        setPreviewUrl(null)
        return
      }
      setPreviewUrl(data.signedUrl)
    })()

    return () => {
      cancelled = true
    }
  }, [supabase, currentPath])

  const upload = async (file: File) => {
    setUploading(true)
    setFileName(file.name)

    try {
      const ext = file.name.split('.').pop() || 'png'
      const path = `${userId}/id-${Date.now()}.${ext}`

      const { error } = await supabase.storage.from('kyc').upload(path, file, {
        upsert: true,
        contentType: file.type,
      })
      if (error) throw error

      toast.success('ID uploaded.')
      onUploaded(path)
    } catch (e: any) {
      toast.error(e?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className='rounded-2xl border bg-white p-4 sm:p-5'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <p className='text-sm font-medium text-zinc-900'>Valid ID</p>
          <p className='mt-1 text-xs text-zinc-500'>
            Upload a government-issued ID (image). Stored privately.
          </p>
        </div>

        <Badge
          className='w-fit rounded-2xl'
          variant={currentPath ? 'secondary' : 'outline'}
        >
          {currentPath ? 'On file' : 'Not uploaded'}
        </Badge>
      </div>

      {/* Preview + details */}
      <div className='mt-4 grid gap-4 sm:grid-cols-[140px_1fr]'>
        <div className='overflow-hidden rounded-2xl border bg-zinc-50'>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt='Uploaded ID preview'
              className='h-36 w-full object-cover'
            />
          ) : (
            <div className='grid h-36 place-items-center text-zinc-400'>
              <FileImage className='h-6 w-6' />
            </div>
          )}
        </div>

        <div className='min-w-0'>
          <p className='text-xs text-zinc-500'>Current file</p>
          {currentPath ? (
            <p className='mt-1 truncate text-sm text-zinc-900'>{currentPath}</p>
          ) : (
            <p className='mt-1 text-sm text-zinc-600'>
              No document uploaded yet.
            </p>
          )}

          {fileName && (
            <p className='mt-2 text-xs text-zinc-500'>
              Selected: <span className='text-zinc-700'>{fileName}</span>
            </p>
          )}

          {/* Upload action */}
          <div className='mt-4 flex flex-col gap-2 sm:flex-row'>
            <label className='w-full sm:w-auto'>
              <input
                type='file'
                accept='image/*'
                className='hidden'
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) upload(f)
                }}
              />

              <Button
                type='button'
                className='w-full rounded-2xl sm:w-auto'
                disabled={uploading}
              >
                <UploadCloud className='mr-2 h-4 w-4' />
                {uploading
                  ? 'Uploading…'
                  : currentPath
                  ? 'Replace ID'
                  : 'Upload ID'}
              </Button>
            </label>

            {currentPath && (
              <Button
                type='button'
                variant='outline'
                className='w-full rounded-2xl bg-white sm:w-auto'
                disabled={uploading}
                onClick={async () => {
                  // Refresh signed url
                  const { data, error } = await supabase.storage
                    .from('kyc')
                    .createSignedUrl(currentPath, 60 * 5)
                  if (error) return toast.error('Could not refresh preview.')
                  setPreviewUrl(data.signedUrl)
                  toast('Preview refreshed.')
                }}
              >
                <RefreshCcw className='mr-2 h-4 w-4' />
                Refresh preview
              </Button>
            )}
          </div>

          <p className='mt-3 text-xs text-zinc-500'>
            Tip: Use a clear photo (front side). Blurry images may delay
            verification.
          </p>
        </div>
      </div>
    </div>
  )
}
