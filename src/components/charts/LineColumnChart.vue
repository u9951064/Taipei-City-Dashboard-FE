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
	...props.series.column.map(({ name, data }) => ({
		name,
		type: "column",
		data,
	})),
	props.series.line
		? {
				name: props.series.line.name,
				type: "line",
				data: props.series.line.data,
				color: "#ffffff",
		  }
		: {},
]);

const chartOptions = ref({
	chart: {
		stacked: true,
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
		offsetY: 20,
	},
	grid: {
		show: false,
	},
	legend: {
		show: props.chart_config.categories ? true : false,
	},
	plotOptions: {
		bar: {
			borderRadius: 5,
		},
	},
	stroke: {
		colors: ["#282a2c"],
		show: true,
		width: 2,
	},
	tooltip: {
		// The class "chart-tooltip" could be edited in /assets/styles/chartStyles.css
		custom: function ({ series, seriesIndex, dataPointIndex, w }) {
			return (
				'<div class="chart-tooltip">' +
				"<h6>" +
				w.globals.labels[dataPointIndex] +
				`${
					props.chart_config.categories
						? "-" + w.globals.seriesNames[seriesIndex]
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
			show: false,
		},
		axisTicks: {
			show: false,
		},
		categories: props.chart_config.categories
			? props.chart_config.categories
			: [],
		labels: {
			offsetY: 5,
		},
		tooltip: {
			enabled: false,
		},
		type: "category",
	},
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
	<div v-if="activeChart === 'LineColumnChart'">
		<apexchart
			width="100%"
			height="270px"
			:options="chartOptions"
			:series="parseSeries"
			@dataPointSelection="handleDataSelection"
		></apexchart>
	</div>
</template>
