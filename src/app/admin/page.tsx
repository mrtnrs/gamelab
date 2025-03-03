"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiPlus, FiGrid, FiUsers, FiTrendingUp, FiActivity, FiAlertCircle } from 'react-icons/fi'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalGames: 0,
    totalUsers: 0,
    activeUsers: 0,
    newGames: 0
  })
  
  // Mock data loading
  useEffect(() => {
    // In a real app, this would fetch data from Supabase
    // const fetchStats = async () => {
    //   const { data: games } = await supabase.from('games').select('*')
    //   const { data: users } = await supabase.from('users').select('*')
    //   // etc.
    // }
    
    // Mock data
    setTimeout(() => {
      setStats({
        totalGames: 124,
        totalUsers: 3842,
        activeUsers: 1256,
        newGames: 12
      })
    }, 500)
  }, [])
  
  // Mock recent activity data
  const recentActivity = [
    { id: 1, type: 'game_added', title: 'Space Explorer', user: 'AI Generator', time: '2 hours ago' },
    { id: 2, type: 'user_joined', title: 'New user registered', user: 'johndoe@example.com', time: '3 hours ago' },
    { id: 3, type: 'game_updated', title: 'Zombie Survival', user: 'Admin', time: '5 hours ago' },
    { id: 4, type: 'user_joined', title: 'New user registered', user: 'jane@example.com', time: '1 day ago' },
    { id: 5, type: 'game_added', title: 'Fantasy Quest', user: 'AI Generator', time: '1 day ago' }
  ]
  
  // Mock alerts data
  const alerts = [
    { id: 1, type: 'warning', message: 'Storage usage at 75%', time: '1 hour ago' },
    { id: 2, type: 'info', message: 'System update scheduled for tomorrow', time: '5 hours ago' }
  ]
  
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link
          href="/admin/games/new"
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <FiPlus className="mr-2 h-4 w-4" />
          Add New Game
        </Link>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Total Games</p>
              <h3 className="text-3xl font-bold mt-1">{stats.totalGames}</h3>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <FiGrid className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 text-sm text-green-500 flex items-center">
            <FiTrendingUp className="mr-1 h-4 w-4" />
            <span>+5% from last month</span>
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Total Users</p>
              <h3 className="text-3xl font-bold mt-1">{stats.totalUsers}</h3>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <FiUsers className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 text-sm text-green-500 flex items-center">
            <FiTrendingUp className="mr-1 h-4 w-4" />
            <span>+12% from last month</span>
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Active Users</p>
              <h3 className="text-3xl font-bold mt-1">{stats.activeUsers}</h3>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <FiActivity className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 text-sm text-green-500 flex items-center">
            <FiTrendingUp className="mr-1 h-4 w-4" />
            <span>+3% from last week</span>
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">New Games (30d)</p>
              <h3 className="text-3xl font-bold mt-1">{stats.newGames}</h3>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <FiPlus className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 text-sm text-green-500 flex items-center">
            <FiTrendingUp className="mr-1 h-4 w-4" />
            <span>+2 from last month</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-card rounded-lg shadow-sm border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
          </div>
          <div className="divide-y divide-border">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="px-6 py-4">
                <div className="flex items-start">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                    {activity.type === 'game_added' && <FiPlus className="h-5 w-5 text-primary" />}
                    {activity.type === 'user_joined' && <FiUsers className="h-5 w-5 text-primary" />}
                    {activity.type === 'game_updated' && <FiActivity className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.type === 'user_joined' ? 'by' : 'updated by'} {activity.user}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activity.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-border">
            <Link
              href="/admin/activity"
              className="text-primary hover:underline text-sm"
            >
              View all activity
            </Link>
          </div>
        </div>
        
        {/* Alerts */}
        <div className="bg-card rounded-lg shadow-sm border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-xl font-semibold">System Alerts</h2>
          </div>
          <div className="divide-y divide-border">
            {alerts.map((alert) => (
              <div key={alert.id} className="px-6 py-4">
                <div className="flex items-start">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                    <FiAlertCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-sm text-muted-foreground">{alert.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-border">
            <Link
              href="/admin/alerts"
              className="text-primary hover:underline text-sm"
            >
              View all alerts
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
