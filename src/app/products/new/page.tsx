'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function NewProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    sizes: '',
    colors: '',
    stock: '',
    imageUrl: '',
  })
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const supabase = createClient()
      
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

      const { error } = await supabase.from('products').insert({
        name: formData.name,
        slug: slug,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        sizes: formData.sizes.split(',').map(s => s.trim()).filter(Boolean),
        colors: formData.colors.split(',').map(c => c.trim()).filter(Boolean),
        stock: parseInt(formData.stock),
        images: formData.imageUrl ? [formData.imageUrl] : [],
      })

      if (error) throw error

      alert('Product created successfully!')
      router.push('/products')
      router.refresh()
    } catch (error: any) {
      console.error(error)
      alert(error.message || 'Failed to create product.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
        <p className="text-muted-foreground mt-1">Create a new product for your store</p>
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

            <div className="grid grid-cols-2 gap-4">
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
            <h2 className="text-xl font-semibold mb-4">Images</h2>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input id="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://example.com/image.jpg" />
              <p className="text-xs text-muted-foreground">For now, just paste a direct link to an image.</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  )
}
