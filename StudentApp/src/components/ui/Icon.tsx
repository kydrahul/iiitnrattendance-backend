import React from 'react';
import { View } from 'react-native';
import * as icons from 'lucide-react-native';

type IconName = keyof typeof icons;

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  style?: any;
}

export const Icon: React.FC<Props> = ({ name, size = 24, color = '#000', style }) => {
  const IconComponent = icons[name];

  if (!IconComponent) {
    console.warn(`Icon "${String(name)}" not found`);
    return <View style={[{ width: size, height: size }, style]} />;
  }

  return (
    <IconComponent
      size={size}
      color={color}
      style={style}
    />
  );
};