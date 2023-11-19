<!-- Developed by Taipei Urban Intelligence Center 2023 -->

<script setup>
import { ref, computed } from "vue";
import { useMapStore } from "../../store/mapStore";

const props = defineProps([
	"chart_config",
	"activeChart",
	"series",
	"map_config",
]);
const mapStore = useMapStore();

const chartOptions = ref({
	chart: {
		offsetY: 15,
		stacked: false,
		toolbar: {
			show: false,
		},
	},
	grid: {
		borderColor: "#555",
	},
	dataLabels: {
		enabled: props.chart_config.categories ? false : true,
		offsetX: -6,
	},
	plotOptions: {
		bar: {
			horizontal: true,
			dataLabels: {
				position: "top",
			},
			borderRadius: 2,
			borderRadiusApplication: 'end'
		},
	},
	xaxis: {
		type: "category",
		categories: props.chart_config.categories,
		axisBorder: {
			color: "#555",
			height: "0.8",
		},
		axisTicks: {
			show: false,
		},
	},

	fill: {
		opacity: 1,
	},
	colors: props.chart_config.color,
	legend: {
		position: "bottom",
		horizontalAlign: "center",
	},
	tooltip: {
		// The class "chart-tooltip" could be edited in /assets/styles/chartStyles.css
		custom: function ({ series, seriesIndex, dataPointIndex, w }) {
			return (
				'<div class="chart-tooltip">' +
				"<h6>" +
				w.globals.seriesNames[seriesIndex] +
				"</h6>" +
				"<span>" +
				series[seriesIndex][dataPointIndex] +
				` ${props.chart_config.unit}` +
				"</span>" +
				"</div>"
			);
		},
	},
});

const chartHeight = computed(() => {
	return Math.max(250, 40 + props.series[0].data.length * 30).toString();
});

const selectedIndex = ref(null);

function handleDataSelection(e, chartContext, config) {
	if (!props.chart_config.map_filter) {
		return;
	}
	if (config.dataPointIndex !== selectedIndex.value) {
		mapStore.addLayerFilter(
			`${props.map_config[0].index}-${props.map_config[0].type}`,
			props.chart_config.map_filter[0],
			props.chart_config.map_filter[1][config.dataPointIndex]
		);
		selectedIndex.value = config.dataPointIndex;
	} else {
		mapStore.clearLayerFilter(
			`${props.map_config[0].index}-${props.map_config[0].type}`
		);
		selectedIndex.value = null;
	}
}
</script>

<template>
	<div v-if="activeChart === 'GroupedBarChart'">
		<apexchart
			width="100%"
			:height="chartHeight"
			type="bar"
			:options="chartOptions"
			:series="series"
			@dataPointSelection="handleDataSelection"
		></apexchart>
	</div>
</template>
