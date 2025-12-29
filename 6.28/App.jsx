import React, { useState, useEffect } from 'react'
import { Button } from './src/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './src/components/ui/card.jsx'
import { Input } from './src/components/ui/input.jsx'
import { Label } from './src/components/ui/label.jsx'
import { Textarea } from './src/components/ui/textarea.jsx'
import { Checkbox } from './src/components/ui/checkbox.jsx'
import { Badge } from './src/components/ui/badge.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './src/components/ui/table.jsx'
import { Upload, Search, Filter, Download, BarChart3, PieChart } from 'lucide-react'
import './App.css'

function App() {
  const [peptideSequences, setPeptideSequences] = useState('FFMPGF\nDFPFW\nSFGWF\nFMPGF')
  const [analysisResults, setAnalysisResults] = useState([])
  const [filteredResults, setFilteredResults] = useState([])
  const [selectedActivities, setSelectedActivities] = useState([])
  const [availableActivities, setAvailableActivities] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    // Load available activities from API
    fetch('http://localhost:5000/api/activities')
      .then(response => response.json())
      .then(data => setAvailableActivities(data))
      .catch(error => console.error('Error loading activities:', error))
  }, [])

  const handleAnalyze = async () => {
    if (!peptideSequences.trim()) return
    
    setIsAnalyzing(true)
    
    try {
      const sequences = peptideSequences.split('\n').filter(seq => seq.trim())
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sequences })
      })
      
      const results = await response.json()
      setAnalysisResults(results)
      setFilteredResults(results)
    } catch (error) {
      console.error('Error analyzing peptides:', error)
      alert('分析过程中出现错误，请检查网络连接或稍后重试。')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleActivityFilter = (activity, checked) => {
    let newSelectedActivities
    if (checked) {
      newSelectedActivities = [...selectedActivities, activity]
    } else {
      newSelectedActivities = selectedActivities.filter(a => a !== activity)
    }
    setSelectedActivities(newSelectedActivities)

    // Filter results
    if (newSelectedActivities.length === 0) {
      setFilteredResults(analysisResults)
    } else {
      const filtered = analysisResults.filter(result => 
        newSelectedActivities.includes(result.activity)
      )
      setFilteredResults(filtered)
    }
  }

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Original Peptide,Active Fragment,Activity\n"
      + filteredResults.map(row => `${row.originalPeptide},${row.activeFragment},${row.activity}`).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "peptide_analysis_results.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Prepare data for visualization
  const getActivityDistribution = () => {
    const activityCounts = {}
    filteredResults.forEach(result => {
      if (result.activity !== 'N/A') {
        activityCounts[result.activity] = (activityCounts[result.activity] || 0) + 1
      }
    })
    
    return Object.entries(activityCounts)
      .map(([activity, count]) => ({ activity, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 activities
  }

  const getPeptideFragmentCounts = () => {
    const peptideCounts = {}
    filteredResults.forEach(result => {
      peptideCounts[result.originalPeptide] = (peptideCounts[result.originalPeptide] || 0) + 1
    })
    
    return Object.entries(peptideCounts)
      .map(([peptide, count]) => ({ peptide, count }))
      .sort((a, b) => b.count - a.count)
  }

  const getTopActivitiesPieData = () => {
    const activityCounts = {}
    filteredResults.forEach(result => {
      if (result.activity !== 'N/A') {
        activityCounts[result.activity] = (activityCounts[result.activity] || 0) + 1
      }
    })
    
    const sortedActivities = Object.entries(activityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // Top 5 activities
    
    return sortedActivities.map(([activity, count]) => ({
      name: activity,
      value: count
    }))
  }

  // Simple bar chart component using CSS
  const SimpleBarChart = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.count))
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-24 text-sm truncate" title={item.activity || item.peptide}>
                {item.activity || item.peptide}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div 
                  className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${(item.count / maxValue) * 100}%` }}
                >
                  <span className="text-white text-xs font-medium">{item.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Simple pie chart component using CSS
  const SimplePieChart = ({ data, title }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              ></div>
              <div className="flex-1 text-sm">
                {item.name}: {item.value} ({((item.value / total) * 100).toFixed(1)}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            高通量生物活性肽功能预测与可视化分析工具
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            基于BIOPEP-UWM数据库的本地化肽序列分析工具，支持批量处理、交互式筛选和可视化展示
          </p>
        </div>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              肽序列输入
            </CardTitle>
            <CardDescription>
              请输入待分析的肽序列，每行一个序列，或上传Excel/CSV文件
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="peptides">肽序列</Label>
              <Textarea
                id="peptides"
                placeholder="FFMPGF&#10;DFPFW&#10;SFGWF&#10;FMPGF"
                value={peptideSequences}
                onChange={(e) => setPeptideSequences(e.target.value)}
                className="min-h-32"
              />
            </div>
            <div className="flex gap-4">
              <Button onClick={handleAnalyze} disabled={isAnalyzing || !peptideSequences.trim()}>
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    分析中...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    开始分析
                  </>
                )}
              </Button>
              // 在App组件中添加文件处理函数
              const handleFileUpload = async (event) => {
              const file = event.target.files[0]
              if (!file) return
              
              const formData = new FormData()
              formData.append('file', file)
              
              try {
              const response = await fetch('http://localhost:5000/api/upload', {
              method: 'POST',
              body: formData
              })
              const data = await response.json()
              if (data.sequences) {
              setPeptideSequences(data.sequences.join('\n'))
              }
              } catch (error) {
              console.error('文件上传失败:', error)
              alert('文件上传失败，请检查文件格式')
              }
              }
              
              // 修改上传按钮
              <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="file-upload"
              />
              <Button variant="outline" onClick={() => document.getElementById('file-upload').click()}>
              <Upload className="h-4 w-4 mr-2" />
              上传Excel/CSV文件
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filter Section */}
        {analysisResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                活性功能筛选
              </CardTitle>
              <CardDescription>
                选择感兴趣的生物活性功能进行筛选
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {availableActivities.map((activity) => (
                  <div key={activity} className="flex items-center space-x-2">
                    <Checkbox
                      id={activity}
                      checked={selectedActivities.includes(activity)}
                      onCheckedChange={(checked) => handleActivityFilter(activity, checked)}
                    />
                    <Label htmlFor={activity} className="text-sm">
                      {activity}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedActivities.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">已选择的活性：</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedActivities.map((activity) => (
                      <Badge key={activity} variant="secondary">
                        {activity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Visualization Section */}
        {filteredResults.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Distribution Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  活性功能分布
                </CardTitle>
                <CardDescription>
                  各种生物活性功能的片段数量分布（前10名）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart data={getActivityDistribution()} title="" />
              </CardContent>
            </Card>

            {/* Top Activities Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  主要活性功能占比
                </CardTitle>
                <CardDescription>
                  前5种活性功能的占比分布
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimplePieChart data={getTopActivitiesPieData()} title="" />
              </CardContent>
            </Card>

            {/* Peptide Fragment Count Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  肽序列活性片段数量
                </CardTitle>
                <CardDescription>
                  每个肽序列包含的活性片段数量
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart data={getPeptideFragmentCounts()} title="" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Section */}
        {filteredResults.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    分析结果
                  </CardTitle>
                  <CardDescription>
                    共找到 {filteredResults.length} 个生物活性片段
                  </CardDescription>
                </div>
                <Button onClick={handleExport} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  导出结果
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>原始肽序列</TableHead>
                      <TableHead>活性片段</TableHead>
                      <TableHead>生物活性功能</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">{result.originalPeptide}</TableCell>
                        <TableCell className="font-mono font-semibold text-blue-600">
                          {result.activeFragment}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{result.activity}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Section */}
        {filteredResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">总肽序列数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(filteredResults.map(r => r.originalPeptide)).size}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">活性片段数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredResults.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">活性功能类型</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(filteredResults.map(r => r.activity)).size}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

