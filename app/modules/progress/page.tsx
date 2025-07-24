'use client'

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Badge } from '@/components/ui/badge';

interface DashboardData {
  totalSessions: number;
  moduleCounts: { [key: string]: number };
  scoreTrends: { date: string; [key: string]: number | string }[];
  analysis: {
    strongestArea: { name: string; score: number };
    weakestArea: { name: string; score: number };
  };
  recentActivity: { module: string; date: string }[];
}

export default function ProgressPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/progress-data');
        if (!response.ok) {
          throw new Error('Failed to fetch progress data.');
        }
        const result = await response.json();
        if (result.message === 'No practice sessions found.') {
            setData(null);
        } else {
            setData(result);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }
  
  if (error || !data) {
    return (
        <div className="min-h-screen bg-background">
            <Navigation />
            <div className="max-w-7xl mx-auto px-4 py-12 text-center">
                <Card>
                    <CardHeader>
                        <CardTitle>No Progress Data Found</CardTitle>
                        <CardDescription>You haven't completed any practice sessions yet.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Go to the modules page to get started and track your progress here!</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
  }

  const moduleChartData = Object.keys(data.moduleCounts).map(key => ({
    name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    sessions: data.moduleCounts[key]
  }));
  
  const scoreKeysAndColors = [
      { key: 'clarity', color: '#8884d8' }, { key: 'conciseness', color: '#82ca9d' },
      { key: 'impact', color: '#ffc658' }, { key: 'correctness', color: '#ff7300' },
      { key: 'readability', color: '#00C49F' }, { key: 'tone', color: '#d0ed57' },
      { key: 'constructiveness', color: '#ff8042' }, { key: 'specificity', color: '#0088FE' },
      { key: 'effectiveness', color: '#A4DE6C' }, { key: 'precision', color: '#FFBB28' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="modules" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold">Your Progress</h1>
          <p className="text-lg text-muted-foreground">Track your English learning journey and see how far you've come.</p>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 mb-6">
          <Card><CardHeader><CardTitle>Total Sessions</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold">{data.totalSessions}</p></CardContent></Card>
          <Card><CardHeader><CardTitle>💪 Strongest Area</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold capitalize">{data.analysis.strongestArea.name}</p><p className="text-muted-foreground">Average Score: {data.analysis.strongestArea.score}</p></CardContent></Card>
          <Card><CardHeader><CardTitle>🎯 Area to Improve</CardTitle><CardDescription>Focus your next practice here!</CardDescription></CardHeader><CardContent><p className="text-2xl font-bold capitalize">{data.analysis.weakestArea.name}</p><p className="text-muted-foreground">Average Score: {data.analysis.weakestArea.score}</p></CardContent></Card>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <Card className="lg:col-span-3">
            <CardHeader><CardTitle>Score Trends Over Time</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data.scoreTrends} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  {scoreKeysAndColors.map(item => (<Line key={item.key} type="monotone" dataKey={item.key} name={item.key.charAt(0).toUpperCase() + item.key.slice(1)} stroke={item.color} strokeWidth={2} />))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Session Distribution by Module</CardTitle></CardHeader>
            <CardContent>
               <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={moduleChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="sessions" fill="var(--color-primary)" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
             <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
             <CardContent>
                <ul className="space-y-4">
                    {data.recentActivity.map((activity, index) => (
                        <li key={index} className="flex flex-col pb-2 border-b last:border-b-0">
                            <span className="font-medium capitalize">{activity.module.replace(/_/g, ' ')}</span>
                            <span className="text-sm text-muted-foreground">{activity.date}</span>
                        </li>
                    ))}
                </ul>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}