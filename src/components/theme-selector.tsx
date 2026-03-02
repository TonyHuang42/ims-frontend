import { useTheme } from 'next-themes';
import { Laptop, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const themes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'Auto', icon: Laptop },
] as const;

export function ThemeSelector() {
  const { theme = 'system', setTheme, resolvedTheme } = useTheme();

  const currentIcon =
    themes.find((t) => t.value === (resolvedTheme ?? theme))?.icon ?? Laptop;

  return (
    <DropdownMenu>
      <Tooltip>
        <DropdownMenuTrigger asChild>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              {currentIcon === Sun && (
                <Sun className="size-4" aria-hidden />
              )}
              {currentIcon === Moon && (
                <Moon className="size-4" aria-hidden />
              )}
              {currentIcon === Laptop && (
                <Laptop className="size-4" aria-hidden />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </TooltipTrigger>
        </DropdownMenuTrigger>
        <TooltipContent side="bottom">Theme</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={theme ?? 'system'}
          onValueChange={(value) => setTheme(value)}
        >
          {themes.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon className="mr-2 size-4" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
