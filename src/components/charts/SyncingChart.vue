<!-- Developed by Taipei Urban Intelligence Center 2023 -->

<script setup>
import { computed } from "vue";

const props = defineProps(["chart_config", "activeChart", "series"]);

const generateChartOptions = (chartId, index) => {
	return {
		chart: {
			id: chartId,
			group: props.chart_config.sync_id,
			type: "bar",
			toolbar: {
				show: false,
				tools: {
					zoom: false,
				},
			},
		},
		colors: [props.chart_config.color[index]],
		dataLabels: {
			enabled: false,
		},
		grid: {
			show: false,
		},
		legend: {
			show: true,
		},
		markers: {
			hover: {
				size: 3,
			},
			size: 0,
			strokeWidth: 0,
		},
		stroke: {
			colors: [props.chart_config.color[index]],
			curve: "smooth",
			show: true,
			width: 2,
		},
		tooltip: {
			custom: function ({ series, seriesIndex, dataPointIndex, w }) {
				// The class "chart-tooltip" could be edited in /assets/styles/chartStyles.css
				return (
					'<div class="chart-tooltip">' +
					"<h6>" +
					`${
						props.chart_config.categories
							? w.globals.seriesNames[seriesIndex]
							: ""
					}` +
					"</h6>" +
					"<span>" +
					series[seriesIndex][dataPointIndex] +
					` ${props.chart_config.unit}` +
					"</span>" +
					"</div>"
				);
			},
		},
		xaxis: {
			tickAmount: 10,
			axisBorder: {
				color: "#555",
				height: "0.8",
			},
			axisTicks: {
				show: false,
			},
			crosshairs: {
				show: false,
			},
			tooltip: {
				enabled: false,
			},
			categories: props.chart_config.categories
				? props.chart_config.categories
				: [],
			type: "category",
		},
		yaxis: {
			tickAmount: 3,
		},
	};
};

const syncingChartOptions = computed(() =>
	props.series.map((ele, index) => {
		return {
			...generateChartOptions(ele.name, index),
			series: [ele],
		};
	})
);
</script>

<template>
	<div v-if="activeChart === 'SyncingChart'">
		<apexchart
			v-for="option in syncingChartOptions"
			width="100%"
			height="130px"
			:key="option.chart.id"
			:options="option"
			:series="option.series"
		></apexchart>
	</div>
</template>
