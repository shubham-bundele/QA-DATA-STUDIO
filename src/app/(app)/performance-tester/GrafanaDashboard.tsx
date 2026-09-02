import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export function GrafanaDashboard({ liveData, isRunning, results }: { liveData: any[], isRunning: boolean, results: any }) {
  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  const mockStatusCodes = [
    { name: '200 OK', value: results ? results.successfulRequests : (liveData.length > 0 ? liveData[liveData.length-1].successfulRequests || 1 : 1) },
    { name: '4xx', value: results ? results.failedRequests : (liveData.length > 0 ? liveData[liveData.length-1].failedRequests || 0 : 0) },
    { name: '5xx', value: 0 },
  ];

  const currentRps = liveData.length > 0 ? liveData[liveData.length-1].rps : 0;
  const currentLatency = liveData.length > 0 ? liveData[liveData.length-1].latency : 0;
  const maxRps = Math.max(10, ...liveData.map(d => d.rps || 0));

  return (
    <div className="bg-[#181b1f] text-gray-200 p-4 rounded-xl border border-gray-800 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          K6 Performance Dashboard
        </h2>
        <div className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">Live Telemetry</div>
      </div>

      {/* Top row: Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#22252b] border-gray-700">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">RPS (Current)</p>
            <p className="text-3xl font-mono text-green-400">{currentRps}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#22252b] border-gray-700">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Latency (Current)</p>
            <p className="text-3xl font-mono text-yellow-400">{currentLatency} <span className="text-sm">ms</span></p>
          </CardContent>
        </Card>
        <Card className="bg-[#22252b] border-gray-700">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">VUs Active</p>
            <p className="text-3xl font-mono text-blue-400">{isRunning ? 'Active' : '0'}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#22252b] border-gray-700">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Error Rate</p>
            <p className="text-3xl font-mono text-red-400">0.00%</p>
          </CardContent>
        </Card>
      </div>

      {/* Middle row: Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[#22252b] border-gray-700">
          <CardHeader className="p-3 pb-0 border-b border-gray-700/50">
            <CardTitle className="text-sm font-medium text-gray-300">Requests Per Second (RPS)</CardTitle>
          </CardHeader>
          <CardContent className="p-2 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="time" stroke="#666" tick={{fill: '#666', fontSize: 10}} />
                <YAxis stroke="#666" tick={{fill: '#666', fontSize: 10}} domain={[0, 'dataMax + 10']} />
                <Tooltip contentStyle={{backgroundColor: '#181b1f', borderColor: '#333'}} />
                <Area type="monotone" dataKey="rps" stroke="#10b981" fill="#10b981" fillOpacity={0.2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#22252b] border-gray-700">
          <CardHeader className="p-3 pb-0 border-b border-gray-700/50">
            <CardTitle className="text-sm font-medium text-gray-300">HTTP Request Duration (ms)</CardTitle>
          </CardHeader>
          <CardContent className="p-2 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={liveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="time" stroke="#666" tick={{fill: '#666', fontSize: 10}} />
                <YAxis stroke="#666" tick={{fill: '#666', fontSize: 10}} />
                <Tooltip contentStyle={{backgroundColor: '#181b1f', borderColor: '#333'}} />
                <Line type="monotone" dataKey="latency" stroke="#f59e0b" dot={false} strokeWidth={2} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Pie charts / Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[#22252b] border-gray-700">
          <CardHeader className="p-3 pb-0 border-b border-gray-700/50">
            <CardTitle className="text-sm font-medium text-gray-300">Status Codes</CardTitle>
          </CardHeader>
          <CardContent className="p-2 h-[200px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={mockStatusCodes} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                   {mockStatusCodes.map((entry, index) => (
                     <Cell key={'cell-' + index} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{backgroundColor: '#181b1f', borderColor: '#333'}} />
               </PieChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

