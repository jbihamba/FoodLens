import { StyleSheet, View } from 'react-native';

import { BrandColors } from '@/constants/theme';

export function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <View
      accessibilityLabel="FoodLens"
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}>
      <View
        style={[
          styles.plate,
          {
            width: size * 0.58,
            height: size * 0.58,
            borderRadius: size,
          },
        ]}>
        <View
          style={[
            styles.plateCenter,
            {
              width: size * 0.31,
              height: size * 0.31,
              borderRadius: size,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.primary,
  },
  plate: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#B9D2C2',
  },
  plateCenter: {
    borderWidth: 1.5,
    borderColor: '#B9D2C2',
  },
});
