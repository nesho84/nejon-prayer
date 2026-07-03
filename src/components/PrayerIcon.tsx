import { Ionicons } from "@react-native-vector-icons/ionicons/static";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons/static";
import { StyleProp, TextStyle } from "react-native";

interface Props {
  name: string;
  size: number;
  color: string;
  opacity?: number;
  style?: StyleProp<TextStyle>;
}

// ------------------------------------------------------------
// Renders the correct prayer icon based on the prayer name.
// ------------------------------------------------------------
export default function PrayerIcon({ name, size, color, opacity = 1, style }: Props) {
  const pn = name.toLowerCase();
  const iconStyle: StyleProp<TextStyle> = [{ opacity }, style];
  if (pn === "imsak") return <Ionicons name="time-outline" size={size} color={color} style={iconStyle} />;
  if (pn === "fajr") return <Ionicons name="moon-outline" size={size} color={color} style={iconStyle} />;
  if (pn === "sunrise") return <MaterialDesignIcons name="weather-sunset-up" size={size} color={color} style={iconStyle} />;
  if (pn === "dhuhr") return <Ionicons name="sunny" size={size} color={color} style={iconStyle} />;
  if (pn === "asr") return <Ionicons name="partly-sunny-outline" size={size} color={color} style={iconStyle} />;
  if (pn === "maghrib") return <MaterialDesignIcons name="weather-sunset-down" size={size} color={color} style={iconStyle} />;
  if (pn === "isha") return <Ionicons name="moon-sharp" size={size} color={color} style={iconStyle} />;

  return <Ionicons name="time-outline" size={size} color={color} style={iconStyle} />;
}
