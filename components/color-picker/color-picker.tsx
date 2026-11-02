import { ColorArea } from "./color-area";
import { ColorChannels } from "./color-channels";
import { ColorPickerRoot } from "./color-picker-context";
import { EyeDropperButton } from "./eye-dropper-button";
import { HueSlider } from "./hue-slider";

/**
 * A saturation/brightness area, hue track, screen sampler and channel fields
 * that share one picked color.
 *
 * <ColorPicker.Root value={hex} onValueChange={setHex}>
 *   <ColorPicker.Area />
 *   <ColorPicker.EyeDropper /> <ColorPicker.HueSlider />
 *   <ColorPicker.Channels />
 * </ColorPicker.Root>
 */
export const ColorPicker = {
  Root: ColorPickerRoot,
  Area: ColorArea,
  HueSlider,
  EyeDropper: EyeDropperButton,
  Channels: ColorChannels,
};

export type { ColorFormat } from "./color-channels";
