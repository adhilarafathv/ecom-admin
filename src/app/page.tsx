import { createClient } from '@/lib/supabase/server'
import { Package, ShoppingCart, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch all stats in parallel
  const [
    { count: totalProducts },
    { count: totalOrders },
    { count: lowStockCount },
    { data: recentOrders },
    { data: lowStockProducts },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .lte('stock', 5)
      .gt('stock', 0),
    supabase
      .from('orders')
      .select('id, customer_name, total, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('products')
      .select('id, name, stock, sizes')
      .lte('stock', 5)
      .gt('stock', 0)
      .order('stock', { ascending: true })
      .limit(5),
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':   return 'text-amber-600 bg-amber-500/10'
      case 'Confirmed': return 'text-blue-600 bg-blue-500/10'
      case 'Packed':    return 'text-purple-600 bg-purple-500/10'
      case 'Delivered': return 'text-green-600 bg-green-500/10'
      case 'Cancelled': return 'text-red-600 bg-red-500/10'
      default:          return 'text-gray-600 bg-gray-500/10'
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/products" className="hover:underline">View all products →</Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/orders" className="hover:underline">View all orders →</Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Products with ≤5 units remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Low Stock Products */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {!recentOrders || recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No orders yet.</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">#{order.id.split('-')[0].toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customer_name} — ₹{order.total}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Low Stock Products</CardTitle>
          </CardHeader>
          <CardContent>
            {!lowStockProducts || lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">All products are well-stocked.</p>
            ) : (
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{product.name}</p>
                    </div>
                    <div className="text-sm font-medium text-destructive">
                      {product.stock} in stock
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
