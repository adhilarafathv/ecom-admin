'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    sizes: '',
    colors: '',
    stock: '',
  })

  useEffect(() => {
    const fetchProduct = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error || !data) {
        alert('Product not found.')
        router.push('/products')
        return
      }

      setFormData({
        name: data.name || '',
        description: data.description || '',
        price: String(data.price || ''),
        category: data.category || '',
        sizes: (data.sizes || []).join(', '),
        colors: (data.colors || []).join(', '),
        stock: String(data.stock || ''),
      })
      setCurrentImageUrl(data.images?.[0] || null)
      setIsFetching(false)
    }

    fetchProduct()
  }, [params.id, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      let imageUrl = currentImageUrl || ''

      // Upload new image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, imageFile)

        if (uploadError) throw new Error(`Image Upload Failed: ${uploadError.message}`)

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

      const { error } = await supabase.from('products').update({
        name: formData.name,
        slug: slug,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        sizes: formData.sizes.split(',').map(s => s.trim()).filter(Boolean),
        colors: formData.colors.split(',').map(c => c.trim()).filter(Boolean),
        stock: parseInt(formData.stock),
        images: imageUrl ? [imageUrl] : [],
      }).eq('id', params.id)

      if (error) throw error

      alert('Product updated successfully!')
      router.push('/products')
      router.refresh()
    } catch (error: any) {
      console.error(error)
      alert(error.message || 'Failed to update product.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Edit Product</h1>
        <p className="text-muted-foreground mt-1 text-sm">Update the details for this product</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" value={formData.name} onChange={handleChange} placeholder="e.g. Oversized Heavyweight T-Shirt" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={handleChange}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Product description..."
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input id="price" value={formData.price} onChange={handleChange} type="number" min="0" placeholder="0.00" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={formData.category} onChange={handleChange} placeholder="e.g. T-Shirts" required />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Variants</h2>

            <div className="space-y-2">
              <Label htmlFor="sizes">Sizes (Comma separated)</Label>
              <Input id="sizes" value={formData.sizes} onChange={handleChange} placeholder="S, M, L, XL" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="colors">Colors (Comma separated)</Label>
              <Input id="colors" value={formData.colors} onChange={handleChange} placeholder="Black, White, Olive" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Total Stock</Label>
              <Input id="stock" value={formData.stock} onChange={handleChange} type="number" min="0" placeholder="100" required />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Product Image</h2>
            {currentImageUrl && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Current image:</p>
                <div
                  className="h-32 w-32 rounded-xl bg-cover bg-center bg-muted"
                  style={{ backgroundImage: `url('${currentImageUrl}')` }}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="imageFile">Upload New Image (optional)</Label>
              <Input
                id="imageFile"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">Leave empty to keep the current image.</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
