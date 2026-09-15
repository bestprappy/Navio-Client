"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { useAtom } from "jotai";
import { Check } from "lucide-react";

import { DropdownMenuGroup, DropdownMenuLabel } from "@/components/ui/dropdown-menu";

import { colorThemeAtom } from "./color-theme.atoms";
import { colorThemeOptions, getColorThemeOption, isColorThemeId } from "./color-themes";

/** Color theme swatches for use inside a DropdownMenuContent. */
export function ColorThemeMenuGroup() {
  const [colorTheme, setColorTheme] = useAtom(colorThemeAtom);
  const selected = getColorThemeOption(colorTheme);

  function handleValueChange(value: unknown) {
    if (isColorThemeId(value)) {
      setColorTheme(value);
    } else {
      console.error("ColorThemeMenuGroup: ignored unknown color theme", { value });
    }
  }

  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel className="flex items-center justify-between gap-2">
        Color theme
        <span className="font-semibold text-foreground">{selected.label}</span>
      </DropdownMenuLabel>
      <MenuPrimitive.RadioGroup
        aria-label="Color theme"
        value={colorTheme}
        onValueChange={handleValueChange}
        className="flex items-center gap-2 px-1.5 py-1.5"
      >
        {colorThemeOptions.map((option) => (
          <MenuPrimitive.RadioItem
            key={option.id}
            value={option.id}
            closeOnClick={false}
            aria-label={`${option.label} color theme`}
            title={option.label}
            className="flex size-7 cursor-pointer items-center justify-center rounded-full text-background shadow-xs ring-1 ring-foreground/10 ring-offset-2 ring-offset-popover outline-hidden transition-transform hover:scale-105 data-checked:ring-2 data-checked:ring-foreground/30 data-highlighted:ring-2 data-highlighted:ring-ring focus-visible:ring-2 focus-visible:ring-ring"
            style={{ backgroundColor: option.swatch }}
          >
            <MenuPrimitive.RadioItemIndicator>
              <Check className="size-4" aria-hidden="true" />
            </MenuPrimitive.RadioItemIndicator>
          </MenuPrimitive.RadioItem>
        ))}
      </MenuPrimitive.RadioGroup>
    </DropdownMenuGroup>
  );
}
