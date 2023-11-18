<!-- Developed by Taipei Urban Intelligence Center 2023 -->

<script setup>
import { computed, ref } from "vue";
import { useMapStore } from "../../store/mapStore";

const props = defineProps([
	"chart_config",
	"activeChart",
	"series",
	"map_config",
]);
const mapStore = useMapStore();

const parseSeries = computed(() => [
	props.series.line
		? {
				name: props.series.line.name,
				type: "line",
				data: props.series.line.data,
				color: "#ffffff",
		  }
		: {},
	...props.series.column.map(({ name, data }) => ({
		name,
		type: "column",
		data,
	})),
]);

const chartOptions = ref({
	chart: {
		toolbar: {
			show: false,
			tools: {
				zoom: false,
			},
		},
		type: props.series.line ? "line" : "bar",
	},
	colors: props.chart_config.color,
	dataLabels: {
		enabled: props.chart_config.categories ? false : true,
	},
	grid: {
		show: false,
	},
	legend: {
		show: props.chart_config.categories ? true : false,
	},
	plotOptions: {
		bar: {
			borderRadius: 3,
			borderRadiusApplication: "end",
		},
	},
	stroke: {
		colors: ["#282a2c"],
		show: true,
		width: [2],
	},
	tooltip: {
		// The class "chart-tooltip" could be edited in /assets/styles/chartStyles.css
		custom: function ({ series, seriesIndex, dataPointIndex, w }) {
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
		axisBorder: {
			show: false,
		},
		axisTicks: {
			show: false,
		},
		categories: props.chart_config.categories
			? props.chart_config.categories
			: [],
		tooltip: {
			enabled: false,
		},
		tickPlacement: "between",
	},
	yaxis: [
		{
			opposite: true,
			max: props.chart_config.lineMax,
			min: 0,
			showAlways: true,
		},
		...props.series.column.map((_, index) => ({
			labels: {
				show: index === 0,
			},
			show: index === 0,
			showAlways: true,
			max: props.chart_config.columnMax,
			min: 0,
		})),
	],
});

const selectedIndex = ref(null);

function handleDataSelection(e, chartContext, config) {
	if (!props.chart_config.map_filter) {
		return;
	}
	const toFilter = config.dataPointIndex;
	if (toFilter !== selectedIndex.value) {
		mapStore.addLayerFilter(
			`${props.map_config[0].index}-${props.map_config[0].type}`,
			props.chart_config.map_filter[0],
			props.chart_config.map_filter[1][toFilter]
		);
		selectedIndex.value = toFilter;
	} else {
		mapStore.clearLayerFilter(
			`${props.map_config[0].index}-${props.map_config[0].type}`
		);
		selectedIndex.value = null;
	}
}
</script>

<template>
	<div v-if="activeChart === 'GroupBarWithLineChart'">
		<apexchart
			width="100%"
			height="270px"
			type="line"
			:options="chartOptions"
			:series="parseSeries"
			@dataPointSelection="handleDataSelection"
		></apexchart>
	</div>
</template>
