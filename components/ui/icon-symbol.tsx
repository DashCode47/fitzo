
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

/**
 * Simplified IconSymbol mapping MaterialIcons names to a consistent semantic set.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'cart.fill': 'shopping-cart',
  'nutrition.fill': 'restaurant',
  'fitness.fill': 'fitness-center',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
} as const;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses Material Icons on all platforms for consistency.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
