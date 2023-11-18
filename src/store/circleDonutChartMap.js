import { maplayerCommonLayout, maplayerCommonPaint } from "../assets/configs/mapbox/mapConfig.js";
import mapboxGl from "mapbox-gl";

export class CircleDonutChartMap {

	constructor() {
		this.map = undefined;
		this.circleLayerSource = `benHu_earthquake-circle-source`;
		this.symbolLayerSource = `benHu_earthquake-symbol-source`;
		this.mapConfig = {};
		this.markers = {};
		this.markersOnScreen = {};
		this.dataSourceId = undefined;
		// TODO: 如果這邊需要調整， 目前的寫法，all_componenets.json 也需要調整, 目前這邊還沒有達到共用，可以改進
		this.colors = ["#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c"];
	}

	getCircleLayerSource() {
		return this.circleLayerSource;
	}

	getSymbolLayerSource() {
		return this.symbolLayerSource;
	}

	onClick(map) {
		if (map.getSource(this.circleLayerSource) || map.getSource(this.symbolLayerSource)) return;
	}

	onRender(map) {
		if (map.getSource(this.circleLayerSource) && map.isSourceLoaded(this.circleLayerSource)) {
			this._updateMarkers();
		}

		if (!map.getSource(this.symbolLayerSource)) return;
	}

	setupDataSource(map, map_config, data) {
		this.map = map;
		this.mapConfig = map_config;
		this.dataSourceId = `${map_config.layerId}-source`;
		this.map.addSource(this.dataSourceId, {
			type: "geojson",
			// 這邊的 data 就是  地震的 的 geoJason data
			data: { ...data },
			// https://docs.mapbox.com/style-spec/reference/sources/#geojson-clusterProperties
			cluster: true, // If the data is a collection of point features, setting this to true clusters the points by radius into groups.
			clusterRadius: 80, // default is 50, Radius of each cluster if clustering is enabled. A value of 512 indicates a radius equal to the width of a tile.
			clusterProperties: {
				// ["case", condition, valueIfTrue, valueIfFalse] is a conditional statement in Mapbox GL JS's expression language.
				// condition: This is the condition that is evaluated. If the condition is true, the expression returns valueIfTrue; otherwise, it returns valueIfFalse.
				// 1: If the condition is true, the expression returns 1.
				// 0: If the condition is false, the expression returns 0

				// 如果 level1 是對的， ret 1, 不然就 0, 然後用 + 一直加總
				// 分成五類，每一類 count++
				mag1: ["+", ["case", ["<", ["get", "mag"], 2], 1, 0]],
				mag2: ["+", ["case", ["all", [">=", ["get", "mag"], 2], ["<", ["get", "mag"], 3]], 1, 0]],
				mag3: ["+", ["case", ["all", [">=", ["get", "mag"], 3], ["<", ["get", "mag"], 4]], 1, 0]],
				mag4: ["+", ["case", ["all", [">=", ["get", "mag"], 4], ["<", ["get", "mag"], 5]], 1, 0]],
				mag5: ["+", ["case", [">=", ["get", "mag"], 5], 1, 0]]
			}
		});
	}


	setupStyleLayerAndDonutChart(extra_paint_configs, extra_layout_configs) {
		const map_config = this.mapConfig;

		const layer = {
			id: map_config.layerId,
			type: map_config.type,
			paint: {
				...maplayerCommonPaint[`${map_config.type}`],
				...extra_paint_configs,
				...map_config.paint
			},
			layout: {
				...maplayerCommonLayout[`${map_config.type}`],
				...extra_layout_configs,
				...map_config.layout
			},
			source: this.dataSourceId,
			filter: map_config.filter
		};


		this.map.addLayer(layer);

		// after the GeoJSON data is loaded, update markers on the screen on every frame
		// this.map.on("render", () => {
		// 	console.log('qq', this.dataSourceId);
		// 	if (!this.map.isSourceLoaded(this.dataSourceId)) return;
		// 	this._updateMarkers();
		// });
	}


	_updateMarkers() {
		const newMarkers = {};
		// 拉出 map 化的 features


		// 拉出前，先 filter -> 沒用，上面就已經裝進去了
		// this.map.setFilter(
		// 	"benHu_earthquake-circle",
		// 	["==", ["get", "tsunami"], 1] // 這邊都先hard code 測試
		// );
		//
		// this.map.setFilter(
		// 	"benHu_earthquake-symbol",
		// 	["==", ["get", "tsunami"], 1]
		// );

		const features = this.map.querySourceFeatures(this.dataSourceId);

		// for every cluster on the screen, create an HTML marker for it (if we didn't yet),
		// and add it to the map if it's not there already
		for (const feature of features) {
			const coords = feature.geometry.coordinates;

			// 這邊可以拿到定義的mag1, mag2, 定義在 clusterProperties
			const props = feature.properties;
			const {mag1, mag2, mag3, mag4, mag5} = props
			if (!props.cluster) continue;


			const clusterId = props.cluster_id;
			let marker = this.markers[clusterId];
			if (!marker) {
				const el = this._createDonutChart(mag1, mag2, mag3, mag4, mag5);
				marker = this.markers[clusterId] = new mapboxGl.Marker({ element: el }).setLngLat(coords);
			}
			newMarkers[clusterId] = marker;

			if (!this.markersOnScreen[clusterId]){
				marker.addTo(this.map)
			}
		}
		// for every marker we've added previously, remove those that are no longer visible
		for (const id in this.markersOnScreen) {
			if (!newMarkers[id]) this.markersOnScreen[id].remove();
		}
		this.markersOnScreen = newMarkers;
	}


	/**
	 * code for creating an SVG donut chart from feature properties
	 *
	 * @property {number} mag1 - Magnitude level.
	 * @property {number} mag2 - Magnitude level.
	 * @property {number} mag3 - Magnitude level.
	 * @property {number} mag4 - Magnitude level.
	 * @property {number} mag5 - Magnitude level.
	 *
	 * @return {HTMLElement} - The created SVG donut chart as an HTML element.
	 */
	_createDonutChart(mag1, mag2, mag3, mag4, mag5) {
		const offsets = []; // an array that stores cumulative offsets for each magnitude level.
		const countByEachMagArr = [mag1, mag2, mag3, mag4, mag5];

		let totalCount = 0;
		for (const count of countByEachMagArr) {
			offsets.push(totalCount);
			totalCount += count;
		}

		// 一個例子
		// countsListByMagCategory [0, 1, 1, 11, 2] // 每一個 level 的 count
		// totalCount 15  // total count
		// offsets [0, 0, 1, 2, 13] // 每一個 level 的累積量


		// ternary operator
		// const fontSize =
		// 	totalCount >= 1000 ? 22 : totalCount >= 100 ? 20 : totalCount >= 10 ? 18 : 16;
		// const outerRadius = totalCount >= 1000 ? 50 : totalCount >= 100 ? 32 : totalCount >= 10 ? 24 : 18;

		// 根據 totalCount 的大小，決定 fontSize 和 外徑
		let fontSize;
		let outerRadius;

		if (totalCount >= 1000) {
			outerRadius = 50;
			fontSize = 22;
		} else if (totalCount >= 100) {
			outerRadius = 32;
			fontSize = 20;
		} else if (totalCount >= 10) {
			outerRadius = 24;
			fontSize = 18;
		} else {
			outerRadius = 18;
			fontSize = 16;
		}


		// 內徑是外半徑的 0.6
		const innerRadius = Math.round(outerRadius * 0.6);
		const widthVar = outerRadius * 2;

		// An SVG string (html) is constructed, including calls to the donutSegment function for each magnitude level.
		// The total magnitude is displayed in the center of the donut chart.
		let html = `<div>
            <svg
            	width="${widthVar}"
            	height="${widthVar}"
            	viewbox="0 0 ${widthVar} ${widthVar}"
            	text-anchor="middle"
            	style="font: ${fontSize}px sans-serif;
            	display: block"
            >`;


		for (let i = 0; i < countByEachMagArr.length; i++) {
			html += this._donutSegmentSVG(
				offsets[i] / totalCount,
				(offsets[i] + countByEachMagArr[i]) / totalCount,
				outerRadius,
				innerRadius,
				this.colors[i]
			);
		}

		html += `<circle
					cx="${outerRadius}"
					cy="${outerRadius}"
					r="${innerRadius}"
					fill="white"
				 />
                <text
            	dominant-baseline="central"
            	transform="translate(${outerRadius}, ${outerRadius})"
            	>
                
                <!--   這邊計算 total count   -->
                ${totalCount.toLocaleString()}
            	</text>
            </svg>
            </div>`;

		const el = document.createElement("div");
		el.innerHTML = html;
		// the first child of the div (the SVG element) is returned
		return el.firstChild;
	}


	/**
	 * Creates an SVG path for a donut segment.
	 *
	 * @param {number} start - Starting angle for the donut segment (in the range [0, 1]).
	 * @param {number} end - Ending angle for the donut segment (in the range [0, 1]).
	 * @param {number} out_radius - Outer radius of the donut.
	 * @param {number} inner_radius - Inner radius of the donut.
	 * @param {string} color - Fill color for the donut segment.
	 *
	 * @return {string} - SVG path string for the donut segment.
	 */
	_donutSegmentSVG(start, end, out_radius, inner_radius, color) {
		if (end - start === 1) end -= 0.00001;
		const a0 = 2 * Math.PI * (start - 0.25);
		const a1 = 2 * Math.PI * (end - 0.25);
		const x0 = Math.cos(a0)
		const y0 = Math.sin(a0)
		const x1 = Math.cos(a1)
		const y1 = Math.sin(a1)
		const largeArc = end - start > 0.5 ? 1 : 0;

		// draw an SVG path, M move, L line, A arc
		return `<path d="
			M ${out_radius + inner_radius * x0} ${out_radius + inner_radius * y0}
			L ${out_radius + out_radius * x0} ${out_radius + out_radius * y0}
			A ${out_radius} ${out_radius} 0 ${largeArc} 1 ${out_radius + out_radius * x1} ${out_radius + out_radius * y1}
			L ${out_radius + inner_radius * x1} ${out_radius + inner_radius * y1}
			A ${inner_radius} ${inner_radius} 0 ${largeArc} 0 ${out_radius + inner_radius * x0} ${out_radius + inner_radius * y0}"
			  fill="${color}" />`;

	}
}
