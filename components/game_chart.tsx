'use client'

import React, {useEffect, useRef} from 'react'
import * as echarts from 'echarts'

// 比赛排名图表
export default function TournamentChart() {
    const chartRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const chartDom = chartRef.current
        if (!chartDom) return

        // 初始化实例
        const chart = echarts.init(chartDom)


        // 假数据（可以换成你的动态数据）
        const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5']
        const pp = [14500, 14700, 14900, 15200, 15500]
        const rank = [230, 210, 190, 175, 160]

        // @ts-ignore
        const option: echarts.EChartsOption = {
            backgroundColor: 'transparent',
            title: [
                {
                    text: 'Player123 pp/时长 评价曲线',
                    left: 'center',
                    textStyle: {
                        color: '#fff'
                    }
                }
            ],
            grid: [
                {
                    bottom: '20%',
                    top: '20%',
                    left: '10%',
                    right: '10%'
                }
            ],
            legend: [
                {
                    data: ['pp', 'time', 'XH', 'X', 'SH', 'S', 'A', 'B', 'C', 'D'],
                    bottom: '0%',
                    textStyle: {color: '#fff'}
                }
            ],
            xAxis: [
                {
                    type: 'category',
                    data: Array.from({length: 50}, (_, i) => i + 1),
                    axisLabel: {
                        interval: 9,
                        color: '#fff'
                    },
                    axisLine: {
                        lineStyle: {color: '#aaa'}
                    }
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    name: 'pp',
                    scale: true,
                    axisLabel: {
                        color: '#fff',
                        formatter: '{value} pp'
                    },
                    splitLine: {
                        lineStyle: {color: '#fff'}
                    },
                },
                {
                    type: 'value',
                    name: 'time',
                    min: 0,
                    max: 'dataMax',
                    alignTicks: true,
                    axisLabel: {
                        color: '#fff',
                        formatter: function (value) {
                            const totalSeconds = Math.floor(value);
                            const minute = Math.floor(totalSeconds / 60);
                            const seconds = totalSeconds % 60;
                            return seconds < 10 ? `${minute}:0${seconds}` : `${minute}:${seconds}`;
                        }
                    },
                    splitLine: {
                        lineStyle: {color: '#333'}
                    }
                }
            ],
            series: [
                {
                    name: 'pp',
                    symbol: 'none',
                    type: 'line',
                    smooth: true,
                    data: Array.from({length: 50}, () => Math.random() * 400 + 100),
                    itemStyle: {color: '#5470c6'},
                    markPoint: {
                        data: [
                            {type: 'max', name: 'Max'},
                            {type: 'min', name: 'Min'}
                        ],
                        label: {color: '#fff'}
                    },
                    markLine: {
                        data: [{type: 'average', name: 'Avg', symbol: 'arrow'}],
                        label: {position: 'start', formatter: '{c} pp', color: '#fff'},
                        lineStyle: {color: '#5470c6'}
                    }
                },
                {
                    name: 'time',
                    type: 'bar',
                    yAxisIndex: 1,
                    data: Array.from({length: 50}, () => Math.random() * 300 + 60),
                    itemStyle: {color: '#ffb347'}
                },
            ]
        }

        chart.setOption(option)

        const resizeHandler = () => chart.resize()
        window.addEventListener('resize', resizeHandler)

        return () => {
            chart.dispose()
            window.removeEventListener('resize', resizeHandler)
        }
    }, [])

    return (
        <div
            ref={chartRef}
            className="w-full h-[400px] rounded-lg bg-black/30 backdrop-blur-sm border border-white/10"
        />
    )
}
