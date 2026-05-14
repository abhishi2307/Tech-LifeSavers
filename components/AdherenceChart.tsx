import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { colors } from '../constants/theme';

type DayData = {
  label: string;
  taken: number;
  missed: number;
  total: number;
};

type Props = {
  data: DayData[];
  height?: number;
};

export function AdherenceChart({ data, height = 160 }: Props) {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>No data for this period</Text>
      </View>
    );
  }

  const chartPaddingLeft = 28;
  const chartPaddingBottom = 24;
  const chartPaddingTop = 8;
  const chartWidth = 320;
  const barAreaWidth = chartWidth - chartPaddingLeft;
  const barAreaHeight = height - chartPaddingBottom - chartPaddingTop;

  const maxValue = Math.max(...data.map((d) => d.total), 1);
  const barWidth = barAreaWidth / data.length;
  const barPad = barWidth * 0.18;

  const yGridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        {/* Y-axis grid lines */}
        {yGridLines.map((ratio) => {
          const y = chartPaddingTop + barAreaHeight * (1 - ratio);
          const label = Math.round(ratio * maxValue);
          return (
            <SvgText
              key={ratio}
              x={chartPaddingLeft - 4}
              y={y + 4}
              fontSize={9}
              fill={colors.textSecondary}
              textAnchor="end"
            >
              {ratio === 0 ? '0' : label}
            </SvgText>
          );
        })}

        {/* Baseline */}
        <Line
          x1={chartPaddingLeft}
          y1={chartPaddingTop + barAreaHeight}
          x2={chartWidth}
          y2={chartPaddingTop + barAreaHeight}
          stroke={colors.border}
          strokeWidth={1}
        />

        {data.map((day, i) => {
          const x = chartPaddingLeft + i * barWidth;
          const innerWidth = barWidth - barPad * 2;

          const takenH = day.total > 0 ? (day.taken / maxValue) * barAreaHeight : 0;
          const missedH = day.total > 0 ? (day.missed / maxValue) * barAreaHeight : 0;

          const takenY = chartPaddingTop + barAreaHeight - takenH - missedH;
          const missedY = chartPaddingTop + barAreaHeight - missedH;

          const adherencePct = day.total > 0 ? Math.round((day.taken / day.total) * 100) : 0;
          const barColor =
            adherencePct >= 80 ? colors.success : adherencePct >= 50 ? colors.warning : colors.error;

          return (
            <SvgText
              key={i}
              x={x + barWidth / 2}
              y={height - 6}
              fontSize={9}
              fill={colors.textSecondary}
              textAnchor="middle"
            >
              {day.label}
            </SvgText>
          );
        })}

        {data.map((day, i) => {
          const x = chartPaddingLeft + i * barWidth;
          const innerWidth = barWidth - barPad * 2;

          const takenH = day.total > 0 ? (day.taken / maxValue) * barAreaHeight : 2;
          const missedH = day.total > 0 ? (day.missed / maxValue) * barAreaHeight : 0;

          const takenY = chartPaddingTop + barAreaHeight - takenH - missedH;
          const missedY = chartPaddingTop + barAreaHeight - missedH;

          const adherencePct = day.total > 0 ? Math.round((day.taken / day.total) * 100) : 0;
          const takenColor =
            adherencePct >= 80 ? colors.success : adherencePct >= 50 ? colors.warning : colors.error;

          return (
            <Svg key={i} x={0} y={0}>
              {/* Taken segment */}
              <Rect
                x={x + barPad}
                y={takenY}
                width={innerWidth}
                height={takenH}
                fill={takenColor}
                rx={3}
              />
              {/* Missed segment */}
              {missedH > 0 && (
                <Rect
                  x={x + barPad}
                  y={missedY}
                  width={innerWidth}
                  height={missedH}
                  fill={colors.error + '50'}
                  rx={3}
                />
              )}
            </Svg>
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Taken</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error + '50' }]} />
          <Text style={styles.legendText}>Missed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  emptyText: { fontSize: 13, color: colors.textSecondary },
  legend: { flexDirection: 'row', gap: 16, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: colors.textSecondary },
});
