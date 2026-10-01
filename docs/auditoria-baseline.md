# Comandos antes das alterações

## npm install
```text

added 1 package, changed 1 package, and audited 614 packages in 3s

213 packages are looking for funding
  run `npm fund` for details

4 vulnerabilities (2 low, 2 moderate)

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.

exit=0
```

## npm run lint
```text

> base44-app@0.0.0 lint
> eslint . --quiet


C:\Users\Renan\Downloads\TirdMind\Mesa Certa\mesa-certa\src\components\layout\AddMenu.jsx
  8:10  error  'Textarea' is defined but never used  unused-imports/no-unused-imports

C:\Users\Renan\Downloads\TirdMind\Mesa Certa\mesa-certa\src\components\layout\AppLayout.jsx
  3:8  error  'Sidebar' is defined but never used  unused-imports/no-unused-imports

C:\Users\Renan\Downloads\TirdMind\Mesa Certa\mesa-certa\src\components\layout\TopBar.jsx
  4:26  error  'daysUntil' is defined but never used  unused-imports/no-unused-imports
  5:24  error  'Plus' is defined but never used       unused-imports/no-unused-imports

C:\Users\Renan\Downloads\TirdMind\Mesa Certa\mesa-certa\src\pages\event\Capacity.jsx
  4:10  error  'formatBRL' is defined but never used  unused-imports/no-unused-imports

C:\Users\Renan\Downloads\TirdMind\Mesa Certa\mesa-certa\src\pages\event\Financial.jsx
  5:45  error  'EmptyState' is defined but never used  unused-imports/no-unused-imports

C:\Users\Renan\Downloads\TirdMind\Mesa Certa\mesa-certa\src\pages\event\Networking.jsx
  4:24  error  'StatusPill' is defined but never used  unused-imports/no-unused-imports

C:\Users\Renan\Downloads\TirdMind\Mesa Certa\mesa-certa\src\pages\event\Participants.jsx
   5:10  error  'SectionLabel' is defined but never used  unused-imports/no-unused-imports
   5:24  error  'StatusPill' is defined but never used    unused-imports/no-unused-imports
   9:26  error  'Plus' is defined but never used          unused-imports/no-unused-imports
  12:10  error  'cn' is defined but never used            unused-imports/no-unused-imports

C:\Users\Renan\Downloads\TirdMind\Mesa Certa\mesa-certa\src\pages\event\Revenues.jsx
  10:16  error  'Ticket' is defined but never used  unused-imports/no-unused-imports

C:\Users\Renan\Downloads\TirdMind\Mesa Certa\mesa-certa\src\pages\event\Schedule.jsx
   5:10  error  'SectionLabel' is defined but never used  unused-imports/no-unused-imports
   5:24  error  'InfoTip' is defined but never used       unused-imports/no-unused-imports
  10:10  error  'cn' is defined but never used            unused-imports/no-unused-imports

C:\Users\Renan\Downloads\TirdMind\Mesa Certa\mesa-certa\src\pages\event\Simulator.jsx
  7:10  error  'Input' is defined but never used  unused-imports/no-unused-imports

C:\Users\Renan\Downloads\TirdMind\Mesa Certa\mesa-certa\src\pages\event\Sponsors.jsx
  10:16  error  'Sparkles' is defined but never used  unused-imports/no-unused-imports

C:\Users\Renan\Downloads\TirdMind\Mesa Certa\mesa-certa\src\pages\event\Suppliers.jsx
  5:10  error  'SectionLabel' is defined but never used  unused-imports/no-unused-imports

C:\Users\Renan\Downloads\TirdMind\Mesa Certa\mesa-certa\src\pages\event\Tasks.jsx
  5:10  error  'StatusPill' is defined but never used  unused-imports/no-unused-imports

✖ 19 problems (19 errors, 0 warnings)
  19 errors and 0 warnings potentially fixable with the `--fix` option.


exit=1
```

## npm run typecheck
```text

> base44-app@0.0.0 typecheck
> tsc -p ./jsconfig.json

src/components/ui/button.jsx(37,36): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/button.jsx(37,47): error TS2339: Property 'variant' does not exist on type '{}'.
src/components/ui/button.jsx(37,56): error TS2339: Property 'size' does not exist on type '{}'.
src/components/ui/button.jsx(37,62): error TS2339: Property 'asChild' does not exist on type '{}'.
src/components/ui/dialog.jsx(17,43): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/dialog.jsx(28,43): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/dialog.jsx(28,54): error TS2339: Property 'children' does not exist on type '{}'.
src/components/ui/dialog.jsx(69,41): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/dialog.jsx(77,47): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/input-otp.jsx(7,38): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/input-otp.jsx(7,49): error TS2339: Property 'containerClassName' does not exist on type '{}'.
src/components/ui/input-otp.jsx(8,4): error TS2322: Type '{ ref: ForwardedRef<any>; containerClassName: string; className: string; }' is not assignable to type 'IntrinsicAttributes & (OTPInputProps & RefAttributes<HTMLInputElement>)'.
  Property 'maxLength' is missing in type '{ ref: ForwardedRef<any>; containerClassName: string; className: string; }' but required in type '{ value?: string; onChange?: (newValue: string) => unknown; maxLength: number; textAlign?: "center" | "left" | "right"; onComplete?: (...args: any[]) => unknown; pushPasswordManagerStrategy?: "none" | "increase-width"; pasteTransformer?: (pasted: string) => string; containerClassName?: string; noScriptCSSFallback?: ...'.
src/components/ui/input-otp.jsx(16,43): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/input-otp.jsx(21,42): error TS2339: Property 'index' does not exist on type '{}'.
src/components/ui/input-otp.jsx(21,49): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/input.jsx(5,35): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/input.jsx(5,46): error TS2339: Property 'type' does not exist on type '{}'.
src/components/ui/label.jsx(11,35): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/select.jsx(15,43): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/select.jsx(15,54): error TS2339: Property 'children' does not exist on type '{}'.
src/components/ui/select.jsx(31,50): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/select.jsx(41,52): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/select.jsx(52,43): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/select.jsx(52,54): error TS2339: Property 'children' does not exist on type '{}'.
src/components/ui/select.jsx(52,64): error TS2339: Property 'position' does not exist on type '{}'.
src/components/ui/select.jsx(76,41): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/select.jsx(84,40): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/select.jsx(84,51): error TS2339: Property 'children' does not exist on type '{}'.
src/components/ui/select.jsx(85,4): error TS2741: Property 'value' is missing in type '{ children: Element[]; ref: ForwardedRef<any>; className: string; }' but required in type 'SelectItemProps'.
src/components/ui/select.jsx(102,45): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/slider.jsx(6,36): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/switch.jsx(6,36): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/tabs.jsx(8,38): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/tabs.jsx(19,41): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/tabs.jsx(20,4): error TS2741: Property 'value' is missing in type '{ ref: ForwardedRef<any>; className: string; }' but required in type 'TabsTriggerProps'.
src/components/ui/tabs.jsx(30,41): error TS2339: Property 'className' does not exist on type '{}'.
src/components/ui/tabs.jsx(31,4): error TS2741: Property 'value' is missing in type '{ ref: ForwardedRef<any>; className: string; }' but required in type 'TabsContentProps'.
src/lib/app-params.js(18,24): error TS2339: Property 'env' does not exist on type 'ImportMeta'.
src/lib/app-params.js(20,35): error TS2339: Property 'env' does not exist on type 'ImportMeta'.
src/lib/app-params.js(21,29): error TS2339: Property 'env' does not exist on type 'ImportMeta'.
src/lib/format.js(18,13): error TS2345: Argument of type 'Date' is not assignable to parameter of type 'number'.
src/lib/format.js(24,13): error TS2345: Argument of type 'Date' is not assignable to parameter of type 'number'.
src/lib/format.js(30,13): error TS2345: Argument of type 'Date' is not assignable to parameter of type 'number'.
src/lib/format.js(37,13): error TS2345: Argument of type 'Date' is not assignable to parameter of type 'number'.
src/lib/format.js(40,22): error TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
src/lib/format.js(40,26): error TS2363: The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
src/pages/CreateEvent.jsx(61,12): error TS2322: Type '{ children: Element; variant: string; size: string; className: string; onClick: () => void; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/CreateEvent.jsx(81,21): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/CreateEvent.jsx(81,80): error TS2322: Type '{ className: string; placeholder: string; value: string; onChange: (e: any) => void; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'className' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/CreateEvent.jsx(82,21): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/CreateEvent.jsx(82,70): error TS2322: Type '{ type: string; className: string; value: string; onChange: (e: any) => void; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/CreateEvent.jsx(83,21): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/CreateEvent.jsx(83,80): error TS2322: Type '{ className: string; placeholder: string; value: string; onChange: (e: any) => void; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'className' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/CreateEvent.jsx(94,18): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/CreateEvent.jsx(95,24): error TS2322: Type '{ type: string; className: string; placeholder: string; value: string; onChange: (e: any) => void; disabled: boolean; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/CreateEvent.jsx(98,18): error TS2322: Type '{ children: (string | Element)[]; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/CreateEvent.jsx(99,24): error TS2322: Type '{ type: string; className: string; placeholder: string; value: string; onChange: (e: any) => void; disabled: boolean; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/CreateEvent.jsx(135,12): error TS2322: Type '{ children: string; variant: string; onClick: () => void; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/CreateEvent.jsx(137,14): error TS2322: Type '{ children: (string | Element)[]; disabled: boolean; onClick: () => void; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/CreateEvent.jsx(139,14): error TS2322: Type '{ children: (string | Element)[]; onClick: () => void; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Capacity.jsx(13,8): error TS2322: Type '{ children: any; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Capacity.jsx(15,16): error TS2322: Type '{ type: string; value: any; onChange: (e: any) => any; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Dashboard.jsx(66,12): error TS2741: Property 'className' is missing in type '{ children: string; }' but required in type '{ children: any; className: any; }'.
src/pages/event/Dashboard.jsx(89,18): error TS2741: Property 'children' is missing in type '{ text: string; }' but required in type '{ text: any; children: any; }'.
src/pages/event/Dashboard.jsx(124,16): error TS2741: Property 'children' is missing in type '{ text: string; }' but required in type '{ text: any; children: any; }'.
src/pages/event/Dashboard.jsx(174,90): error TS2741: Property 'className' is missing in type '{ status: any; }' but required in type '{ status: any; className: any; }'.
src/pages/event/EventSettings.jsx(38,17): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(38,66): error TS2322: Type '{ className: string; value: any; onChange: (e: any) => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'className' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(39,17): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(39,66): error TS2322: Type '{ type: string; className: string; value: any; onChange: (e: any) => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(40,17): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(40,76): error TS2322: Type '{ className: string; value: any; onChange: (e: any) => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'className' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(41,17): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(41,67): error TS2322: Type '{ className: string; value: any; onChange: (e: any) => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'className' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(42,17): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(44,16): error TS2322: Type '{ children: Element; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(45,16): error TS2559: Type '{ children: Element[]; }' has no properties in common with type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(45,96): error TS2322: Type '{ children: string; key: string; value: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(48,17): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(48,89): error TS2322: Type '{ type: string; className: string; value: any; onChange: (e: any) => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(55,17): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(55,78): error TS2322: Type '{ type: string; className: string; value: any; onChange: (e: any) => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(56,17): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(56,72): error TS2322: Type '{ type: string; className: string; value: any; onChange: (e: any) => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(57,17): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(57,73): error TS2322: Type '{ type: string; className: string; value: any; onChange: (e: any) => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(58,17): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(58,71): error TS2322: Type '{ type: string; className: string; value: any; onChange: (e: any) => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(65,17): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(65,86): error TS2322: Type '{ type: string; className: string; value: any; onChange: (e: any) => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(66,17): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(66,91): error TS2322: Type '{ type: string; className: string; value: any; onChange: (e: any) => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(67,17): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(67,68): error TS2322: Type '{ type: string; className: string; value: any; onChange: (e: any) => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(77,23): error TS2322: Type '{ checked: any; onCheckedChange: () => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'checked' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/EventSettings.jsx(90,12): error TS2322: Type '{ children: string; variant: string; size: string; className: string; onClick: () => void; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Expenses.jsx(31,10): error TS2322: Type '{ children: (string | Element)[]; size: string; className: string; onClick: () => void; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Expenses.jsx(50,24): error TS2322: Type '{ value: any; onChange: (evt: any) => any; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'value' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Expenses.jsx(51,24): error TS2322: Type '{ type: string; value: any; onChange: (evt: any) => any; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Expenses.jsx(55,20): error TS2322: Type '{ children: Element; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Expenses.jsx(56,20): error TS2559: Type '{ children: any; }' has no properties in common with type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Expenses.jsx(56,66): error TS2322: Type '{ children: any; key: any; value: any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Expenses.jsx(61,20): error TS2322: Type '{ children: Element; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Expenses.jsx(62,20): error TS2559: Type '{ children: Element[]; }' has no properties in common with type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Expenses.jsx(63,22): error TS2322: Type '{ children: string; value: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Expenses.jsx(64,22): error TS2322: Type '{ children: string; value: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Expenses.jsx(71,28): error TS2322: Type '{ type: string; value: any; onChange: (evt: any) => any; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Expenses.jsx(75,26): error TS2322: Type '{ type: string; value: any; onChange: (evt: any) => any; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Expenses.jsx(83,26): error TS2322: Type '{ type: string; value: any; onChange: (evt: any) => any; className: string; title: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Expenses.jsx(86,20): error TS2322: Type '{ children: Element; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Expenses.jsx(87,20): error TS2559: Type '{ children: Element[]; }' has no properties in common with type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Expenses.jsx(88,22): error TS2322: Type '{ children: string; value: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Expenses.jsx(89,22): error TS2322: Type '{ children: string; value: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Expenses.jsx(90,22): error TS2322: Type '{ children: string; value: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Financial.jsx(29,12): error TS2739: Type '{ label: string; value: string; strong: true; }' is missing the following properties from type '{ label: any; value: any; sub: any; strong: any; tone: any; }': sub, tone
src/pages/event/Financial.jsx(30,12): error TS2739: Type '{ label: string; value: string; tone: string; }' is missing the following properties from type '{ label: any; value: any; sub: any; strong: any; tone: any; }': sub, strong
src/pages/event/Financial.jsx(31,12): error TS2739: Type '{ label: string; value: string; }' is missing the following properties from type '{ label: any; value: any; sub: any; strong: any; tone: any; }': sub, strong, tone
src/pages/event/Financial.jsx(43,12): error TS2739: Type '{ label: string; value: string; strong: true; }' is missing the following properties from type '{ label: any; value: any; sub: any; strong: any; tone: any; }': sub, tone
src/pages/event/Financial.jsx(44,12): error TS2739: Type '{ label: string; value: string; tone: string; }' is missing the following properties from type '{ label: any; value: any; sub: any; strong: any; tone: any; }': sub, strong
src/pages/event/Financial.jsx(45,12): error TS2739: Type '{ label: string; value: string; }' is missing the following properties from type '{ label: any; value: any; sub: any; strong: any; tone: any; }': sub, strong, tone
src/pages/event/Financial.jsx(56,12): error TS2741: Property 'sub' is missing in type '{ label: string; value: string; strong: true; tone: string; }' but required in type '{ label: any; value: any; sub: any; strong: any; tone: any; }'.
src/pages/event/Financial.jsx(57,12): error TS2739: Type '{ label: string; value: string; }' is missing the following properties from type '{ label: any; value: any; sub: any; strong: any; tone: any; }': sub, strong, tone
src/pages/event/Financial.jsx(58,12): error TS2739: Type '{ label: string; value: string; tone: string; }' is missing the following properties from type '{ label: any; value: any; sub: any; strong: any; tone: any; }': sub, strong
src/pages/event/Financial.jsx(63,14): error TS2741: Property 'children' is missing in type '{ text: string; }' but required in type '{ text: any; children: any; }'.
src/pages/event/Financial.jsx(94,57): error TS2741: Property 'className' is missing in type '{ status: any; }' but required in type '{ status: any; className: any; }'.
src/pages/event/Financial.jsx(122,59): error TS2741: Property 'className' is missing in type '{ status: any; }' but required in type '{ status: any; className: any; }'.
src/pages/event/Financial.jsx(182,10): error TS2322: Type '{ children: Element[]; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Financial.jsx(184,14): error TS2322: Type '{ children: string; key: string; value: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Financial.jsx(189,10): error TS2322: Type '{ children: Element; value: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Financial.jsx(190,10): error TS2322: Type '{ children: Element; value: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Financial.jsx(191,10): error TS2322: Type '{ children: Element; value: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Financial.jsx(192,10): error TS2322: Type '{ children: Element; value: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Networking.jsx(3,56): error TS2307: Cannot find module '@/lib/networking/distribution' or its corresponding type declarations.
src/pages/event/Networking.jsx(82,15): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Networking.jsx(82,65): error TS2322: Type '{ type: string; value: any; onChange: (e: any) => any; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Networking.jsx(83,15): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Networking.jsx(83,67): error TS2322: Type '{ type: string; value: any; onChange: (e: any) => any; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Networking.jsx(84,15): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Networking.jsx(84,75): error TS2322: Type '{ type: string; value: any; onChange: (e: any) => any; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Networking.jsx(85,15): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Networking.jsx(85,76): error TS2322: Type '{ type: string; value: any; onChange: (e: any) => any; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Networking.jsx(86,15): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Networking.jsx(86,80): error TS2322: Type '{ type: string; value: any; onChange: (e: any) => any; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Networking.jsx(87,15): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Networking.jsx(87,80): error TS2322: Type '{ type: string; value: any; onChange: (e: any) => any; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Networking.jsx(91,10): error TS2322: Type '{ children: (string | Element)[]; size: string; className: string; onClick: () => void; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Networking.jsx(92,21): error TS2322: Type '{ children: (string | Element)[]; size: string; variant: string; className: string; onClick: () => void; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Networking.jsx(109,16): error TS2741: Property 'className' is missing in type '{ children: (string | number)[]; }' but required in type '{ children: any; className: any; }'.
src/pages/event/Networking.jsx(111,18): error TS2322: Type '{ children: Element; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Networking.jsx(112,18): error TS2559: Type '{ children: Element[]; }' has no properties in common with type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Networking.jsx(112,79): error TS2322: Type '{ children: (string | number)[]; key: number; value: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Networking.jsx(133,20): error TS2322: Type '{ value: string; onChange: (e: any) => void; placeholder: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'value' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Participants.jsx(50,12): error TS2322: Type '{ children: (string | Element)[]; variant: string; size: string; className: string; onClick: () => void; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Participants.jsx(57,18): error TS2322: Type '{ value: string; onChange: (e: any) => void; placeholder: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'value' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Participants.jsx(60,12): error TS2322: Type '{ children: Element; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Participants.jsx(61,12): error TS2559: Type '{ children: (Element | Element[])[]; }' has no properties in common with type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Participants.jsx(61,27): error TS2322: Type '{ children: string; value: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Participants.jsx(61,94): error TS2322: Type '{ children: string; key: string; value: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Participants.jsx(64,12): error TS2322: Type '{ children: Element; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Participants.jsx(65,12): error TS2559: Type '{ children: (Element | Element[])[]; }' has no properties in common with type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Participants.jsx(65,27): error TS2322: Type '{ children: string; value: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Participants.jsx(65,98): error TS2322: Type '{ children: string; key: string; value: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Participants.jsx(70,10): error TS2741: Property 'action' is missing in type '{ title: string; hint: string; }' but required in type '{ title: any; hint: any; action: any; }'.
src/pages/event/Participants.jsx(83,20): error TS2322: Type '{ children: Element; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Participants.jsx(84,20): error TS2559: Type '{ children: Element[]; }' has no properties in common with type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Participants.jsx(84,51): error TS2322: Type '{ children: string; key: string; value: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Participants.jsx(89,20): error TS2322: Type '{ children: Element; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Participants.jsx(90,20): error TS2559: Type '{ children: Element[]; }' has no properties in common with type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Participants.jsx(90,54): error TS2322: Type '{ children: string; key: string; value: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Revenues.jsx(48,24): error TS2322: Type '{ type: string; value: any; onChange: (e: any) => any; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Revenues.jsx(82,10): error TS2322: Type '{ children: (string | Element)[]; size: string; className: string; onClick: () => void; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Revenues.jsx(86,58): error TS2741: Property 'className' is missing in type '{ children: string; }' but required in type '{ children: any; className: any; }'.
src/pages/event/Revenues.jsx(86,96): error TS2741: Property 'children' is missing in type '{ text: string; }' but required in type '{ text: any; children: any; }'.
src/pages/event/Revenues.jsx(97,50): error TS2322: Type '{ value: any; onChange: (e: any) => any; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'value' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Revenues.jsx(99,50): error TS2322: Type '{ type: string; value: any; onChange: (e: any) => any; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Revenues.jsx(100,50): error TS2322: Type '{ type: string; value: any; onChange: (e: any) => any; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Revenues.jsx(101,61): error TS2741: Property 'className' is missing in type '{ status: any; }' but required in type '{ status: any; className: any; }'.
src/pages/event/Revenues.jsx(109,10): error TS2322: Type '{ children: Element[]; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Revenues.jsx(110,12): error TS2741: Property 'className' is missing in type '{ children: Element; }' but required in type '{ [x: string]: any; className: any; }'.
src/pages/event/Revenues.jsx(110,26): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Revenues.jsx(111,17): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Revenues.jsx(111,66): error TS2322: Type '{ className: string; value: string; onChange: (e: any) => void; placeholder: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'className' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Revenues.jsx(112,12): error TS2741: Property 'className' is missing in type '{ children: Element[]; }' but required in type '{ [x: string]: any; className: any; }'.
src/pages/event/Revenues.jsx(112,26): error TS2322: Type '{ children: string; variant: string; onClick: () => void; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Revenues.jsx(112,122): error TS2322: Type '{ children: string; onClick: () => void; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Schedule.jsx(29,12): error TS2322: Type '{ children: Element; variant: string; size: string; className: string; disabled: boolean; onClick: () => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Schedule.jsx(30,12): error TS2322: Type '{ children: Element; variant: string; size: string; className: string; disabled: boolean; onClick: () => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Schedule.jsx(31,12): error TS2322: Type '{ children: Element; variant: string; size: string; className: string; onClick: () => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Schedule.jsx(32,12): error TS2322: Type '{ children: Element; variant: string; size: string; className: string; onClick: () => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Schedule.jsx(37,113): error TS2322: Type '{ className: string; value: any; onChange: (e: any) => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'className' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Schedule.jsx(38,90): error TS2322: Type '{ type: string; className: string; value: any; onChange: (e: any) => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Schedule.jsx(39,97): error TS2322: Type '{ type: string; className: string; value: any; onChange: (e: any) => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Schedule.jsx(42,16): error TS2322: Type '{ children: Element; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Schedule.jsx(43,16): error TS2559: Type '{ children: Element[]; }' has no properties in common with type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Schedule.jsx(43,47): error TS2322: Type '{ children: string; key: string; value: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Schedule.jsx(46,95): error TS2322: Type '{ className: string; value: any; onChange: (e: any) => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'className' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Schedule.jsx(47,90): error TS2322: Type '{ className: string; value: any; onChange: (e: any) => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'className' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Schedule.jsx(90,10): error TS2322: Type '{ children: (string | Element)[]; size: string; className: string; onClick: () => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Simulator.jsx(53,57): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Simulator.jsx(54,21): error TS2322: Type '{ value: any[]; onValueChange: (v: any) => void; min: number; max: any; step: number; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'value' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Simulator.jsx(57,57): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Simulator.jsx(58,21): error TS2322: Type '{ value: number[]; onValueChange: (v: any) => void; min: number; max: number; step: number; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'value' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Simulator.jsx(61,57): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Simulator.jsx(62,21): error TS2322: Type '{ value: any[]; onValueChange: (v: any) => void; min: number; max: number; step: number; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'value' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Simulator.jsx(65,57): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Simulator.jsx(66,21): error TS2322: Type '{ value: any[]; onValueChange: (v: any) => void; min: number; max: number; step: number; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'value' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Simulator.jsx(69,57): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Simulator.jsx(70,21): error TS2322: Type '{ value: any[]; onValueChange: (v: any) => void; min: number; max: number; step: number; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'value' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Simulator.jsx(72,12): error TS2322: Type '{ children: string; variant: string; size: string; className: string; onClick: () => void; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Simulator.jsx(93,16): error TS2741: Property 'children' is missing in type '{ text: string; }' but required in type '{ text: any; children: any; }'.
src/pages/event/Sponsors.jsx(35,10): error TS2322: Type '{ children: (string | Element)[]; size: string; variant: string; className: string; onClick: () => void; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Sponsors.jsx(54,12): error TS2741: Property 'action' is missing in type '{ title: string; hint: string; }' but required in type '{ title: any; hint: any; action: any; }'.
src/pages/event/Sponsors.jsx(67,63): error TS2322: Type '{ type: string; value: any; onChange: (e: any) => any; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Sponsors.jsx(69,63): error TS2741: Property 'className' is missing in type '{ status: any; }' but required in type '{ status: any; className: any; }'.
src/pages/event/Sponsors.jsx(77,10): error TS2322: Type '{ children: Element[]; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Sponsors.jsx(78,12): error TS2741: Property 'className' is missing in type '{ children: Element; }' but required in type '{ [x: string]: any; className: any; }'.
src/pages/event/Sponsors.jsx(78,26): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Sponsors.jsx(80,19): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Sponsors.jsx(80,77): error TS2322: Type '{ className: string; value: string; onChange: (e: any) => void; placeholder: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'className' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Sponsors.jsx(82,21): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Sponsors.jsx(82,71): error TS2322: Type '{ type: string; className: string; value: string; onChange: (e: any) => void; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Sponsors.jsx(83,21): error TS2322: Type '{ children: string; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Sponsors.jsx(83,77): error TS2322: Type '{ type: string; className: string; value: string; onChange: (e: any) => void; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Sponsors.jsx(86,12): error TS2741: Property 'className' is missing in type '{ children: Element[]; }' but required in type '{ [x: string]: any; className: any; }'.
src/pages/event/Sponsors.jsx(86,26): error TS2322: Type '{ children: string; variant: string; onClick: () => void; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Sponsors.jsx(86,126): error TS2322: Type '{ children: string; onClick: () => void; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Suppliers.jsx(44,18): error TS2741: Property 'className' is missing in type '{ status: any; }' but required in type '{ status: any; className: any; }'.
src/pages/event/Suppliers.jsx(60,26): error TS2322: Type '{ type: string; placeholder: string; className: string; onChange: () => void; onBlur: (e: any) => any; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'type' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Suppliers.jsx(61,20): error TS2322: Type '{ children: (string | Element)[]; size: string; variant: string; className: string; onClick: () => void; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Tasks.jsx(50,10): error TS2741: Property 'action' is missing in type '{ title: string; hint: string; }' but required in type '{ title: any; hint: any; action: any; }'.
src/pages/event/Tasks.jsx(66,26): error TS2322: Type '{ value: any; placeholder: string; onChange: (e: any) => any; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'value' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Tasks.jsx(70,22): error TS2322: Type '{ children: Element; className: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Tasks.jsx(71,22): error TS2559: Type '{ children: Element[]; }' has no properties in common with type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/event/Tasks.jsx(71,86): error TS2322: Type '{ children: string; key: string; value: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Events.jsx(30,10): error TS2741: Property 'className' is missing in type '{ status: any; }' but required in type '{ status: any; className: any; }'.
src/pages/Events.jsx(67,12): error TS2322: Type '{ children: (string | Element)[]; size: string; className: string; onClick: () => void; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/ForgotPassword.jsx(46,14): error TS2322: Type '{ children: string; htmlFor: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/ForgotPassword.jsx(50,17): error TS2322: Type '{ id: string; type: string; autoComplete: string; autoFocus: true; placeholder: string; value: string; onChange: (e: any) => void; className: string; required: true; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'id' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/ForgotPassword.jsx(62,12): error TS2322: Type '{ children: string | Element; type: string; className: string; disabled: boolean; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Login.jsx(56,8): error TS2322: Type '{ children: (string | Element)[]; variant: string; className: string; onClick: () => void; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Login.jsx(82,12): error TS2322: Type '{ children: string; htmlFor: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Login.jsx(86,15): error TS2322: Type '{ id: string; type: string; autoComplete: string; autoFocus: true; placeholder: string; value: string; onChange: (e: any) => void; className: string; required: true; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'id' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Login.jsx(100,14): error TS2322: Type '{ children: string; htmlFor: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Login.jsx(108,15): error TS2322: Type '{ id: string; type: string; autoComplete: string; placeholder: string; value: string; onChange: (e: any) => void; className: string; required: true; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'id' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Login.jsx(119,10): error TS2322: Type '{ children: string | Element; type: string; className: string; disabled: boolean; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/OAuthConsent.jsx(41,37): error TS2322: Type '{ Authorization: string; }' is not assignable to type 'HeadersInit'.
  Type '{ Authorization: string; }' is not assignable to type 'Record<string, string>'.
    Index signature for type 'string' is missing in type '{ Authorization: string; }'.
src/pages/OAuthConsent.jsx(139,8): error TS2739: Type '{ children: Element; icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; title: string; }' is missing the following properties from type '{ icon: any; title: any; subtitle: any; footer: any; children: any; }': subtitle, footer
src/pages/OAuthConsent.jsx(153,8): error TS2739: Type '{ icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; title: string; subtitle: string; }' is missing the following properties from type '{ icon: any; title: any; subtitle: any; footer: any; children: any; }': footer, children
src/pages/OAuthConsent.jsx(166,8): error TS2739: Type '{ children: Element; icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; title: string; }' is missing the following properties from type '{ icon: any; title: any; subtitle: any; footer: any; children: any; }': subtitle, footer
src/pages/OAuthConsent.jsx(179,8): error TS2739: Type '{ children: Element; icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; title: string; }' is missing the following properties from type '{ icon: any; title: any; subtitle: any; footer: any; children: any; }': subtitle, footer
src/pages/OAuthConsent.jsx(190,6): error TS2741: Property 'footer' is missing in type '{ children: Element[]; icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; title: string; subtitle: string; }' but required in type '{ icon: any; title: any; subtitle: any; footer: any; children: any; }'.
src/pages/OAuthConsent.jsx(220,10): error TS2322: Type '{ children: string; variant: string; className: string; disabled: boolean; onClick: () => Promise<void>; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/OAuthConsent.jsx(228,10): error TS2322: Type '{ children: (string | Element)[]; className: string; disabled: boolean; onClick: () => Promise<void>; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Register.jsx(76,8): error TS2741: Property 'footer' is missing in type '{ children: Element[]; icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; title: string; subtitle: string; }' but required in type '{ icon: any; title: any; subtitle: any; footer: any; children: any; }'.
src/pages/Register.jsx(87,12): error TS2322: Type '{ children: Element; maxLength: number; value: string; onChange: Dispatch<SetStateAction<string>>; autoFocus: true; autoComplete: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Register.jsx(94,14): error TS2559: Type '{ children: Element[]; }' has no properties in common with type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Register.jsx(95,29): error TS2322: Type '{ index: number; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'index' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Register.jsx(96,29): error TS2322: Type '{ index: number; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'index' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Register.jsx(97,29): error TS2322: Type '{ index: number; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'index' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Register.jsx(98,29): error TS2322: Type '{ index: number; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'index' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Register.jsx(99,29): error TS2322: Type '{ index: number; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'index' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Register.jsx(100,29): error TS2322: Type '{ index: number; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'index' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Register.jsx(104,10): error TS2322: Type '{ children: string | Element; className: string; onClick: () => Promise<void>; disabled: boolean; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Register.jsx(145,8): error TS2322: Type '{ children: (string | Element)[]; variant: string; className: string; onClick: () => void; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Register.jsx(171,12): error TS2322: Type '{ children: string; htmlFor: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Register.jsx(175,15): error TS2322: Type '{ id: string; type: string; autoComplete: string; autoFocus: true; placeholder: string; value: string; onChange: (e: any) => void; className: string; required: true; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'id' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Register.jsx(188,12): error TS2322: Type '{ children: string; htmlFor: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Register.jsx(192,15): error TS2322: Type '{ id: string; type: string; autoComplete: string; placeholder: string; value: string; onChange: (e: any) => void; className: string; required: true; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'id' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Register.jsx(204,12): error TS2322: Type '{ children: string; htmlFor: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Register.jsx(208,15): error TS2322: Type '{ id: string; type: string; autoComplete: string; placeholder: string; value: string; onChange: (e: any) => void; className: string; required: true; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'id' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/Register.jsx(219,10): error TS2322: Type '{ children: string | Element; type: string; className: string; disabled: boolean; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/ResetPassword.jsx(57,6): error TS2741: Property 'footer' is missing in type '{ children: Element[]; icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; title: string; subtitle: string; }' but required in type '{ icon: any; title: any; subtitle: any; footer: any; children: any; }'.
src/pages/ResetPassword.jsx(69,12): error TS2322: Type '{ children: string; htmlFor: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/ResetPassword.jsx(73,15): error TS2322: Type '{ id: string; type: string; autoComplete: string; autoFocus: true; placeholder: string; value: string; onChange: (e: any) => void; className: string; required: true; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'id' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/ResetPassword.jsx(86,12): error TS2322: Type '{ children: string; htmlFor: string; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/ResetPassword.jsx(90,15): error TS2322: Type '{ id: string; type: string; autoComplete: string; placeholder: string; value: string; onChange: (e: any) => void; className: string; required: true; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'id' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.
src/pages/ResetPassword.jsx(101,10): error TS2322: Type '{ children: string | Element; type: string; className: string; disabled: boolean; }' is not assignable to type 'IntrinsicAttributes & RefAttributes<any>'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RefAttributes<any>'.

exit=2
```

## npm run build
```text

> base44-app@0.0.0 build
> vite build

[base44] Warning: VITE_BASE44_APP_ID is not set — this build
[base44] will not know its app id and its API calls will fail.
[base44] Build with:  base44 build   (or base44 deploy --build)
[base44] Proxy not enabled (VITE_BASE44_APP_BASE_URL not set)
vite v8.3.1 building client environment for production...
transforming...
node.exe : [plugin builtin:vite-alias] rewrote @/lib/networking/distribution to /src/lib/networking/distribution but was not an absolute path and was not handled by other plugins. This will lead to duplicated modules for the same path. To avoid 
duplicating modules, you should resolve to an absolute path.
No linha:1 caractere:1
+ & "C:\Program Files\nodejs/node.exe" "C:\Users\Renan\AppData\Roaming\ ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: ([plugin builtin... absolute path.:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
✓ 1898 modules transformed.
✗ Build failed in 1.61s
error during build:
Build failed with 1 error:

[31m[UNLOADABLE_DEPENDENCY] [0mCould not load /src/lib/networking/distribution
   [38;5;246m╭[0m[38;5;246m─[0m[38;5;246m[[0m src/pages/event/Networking.jsx:3:56 [38;5;246m][0m
   [38;5;246m│[0m
 [38;5;246m3 │[0m [38;5;249mi[0m[38;5;249mm[0m[38;5;249mp[0m[38;5;249mo[0m[38;5;249mr[0m[38;5;249mt[0m[38;5;249m [0m[38;5;249m{[0m[38;5;249m [0m[38;5;249mg[0m[38;5;249me[0m[38;5;249mn[0m[38;5;249me[0m[38;5;249mr[0m[38;5
;249ma[0m[38;5;249mt[0m[38;5;249me[0m[38;5;249mD[0m[38;5;249mi[0m[38;5;249ms[0m[38;5;249mt[0m[38;5;249mr[0m[38;5;249mi[0m[38;5;249mb[0m[38;5;249mu[0m[38;5;249mt[0m[38;5;249mi[0m[38;5;249mo[0m[38;5;249mn[0m[38;5;249m,[0m
[38;5;249m [0m[38;5;249mp[0m[38;5;249ma[0m[38;5;249mr[0m[38;5;249mt[0m[38;5;249mi[0m[38;5;249mc[0m[38;5;249mi[0m[38;5;249mp[0m[38;5;249ma[0m[38;5;249mn[0m[38;5;249mt[0m[38;5;249mR[0m[38;5;249mo[0m[38;5;249mu[0m[38;5;249
mt[0m[38;5;249me[0m[38;5;249m [0m[38;5;249m}[0m[38;5;249m [0m[38;5;249mf[0m[38;5;249mr[0m[38;5;249mo[0m[38;5;249mm[0m[38;5;249m [0m"@/lib/networking/distribution"[38;5;249m;[0m
 [38;5;240m  │[0m                                                        ───────────────┬───────────────  
 [38;5;240m  │[0m                                                                       ╰───────────────── O sistema não pode encontrar o caminho especificado. (os error 3)
[38;5;246m───╯[0m

    at aggregateBindingErrorsIntoJsError (file:///C:/Users/Renan/Downloads/TirdMind/Mesa%20Certa/mesa-certa/node_modules/rolldown/dist/shared/error-Bj1xBdEY.mjs:49:18)
    at unwrapBindingResult (file:///C:/Users/Renan/Downloads/TirdMind/Mesa%20Certa/mesa-certa/node_modules/rolldown/dist/shared/error-Bj1xBdEY.mjs:19:128)
    at #build (file:///C:/Users/Renan/Downloads/TirdMind/Mesa%20Certa/mesa-certa/node_modules/rolldown/dist/shared/rolldown-jmAeXo_f.mjs:133:34)
    at async buildEnvironment (file:///C:/Users/Renan/Downloads/TirdMind/Mesa%20Certa/mesa-certa/node_modules/vite/dist/node/chunks/node.js:34445:66)
    at async Object.build (file:///C:/Users/Renan/Downloads/TirdMind/Mesa%20Certa/mesa-certa/node_modules/vite/dist/node/chunks/node.js:34866:19)
    at async Object.buildApp (file:///C:/Users/Renan/Downloads/TirdMind/Mesa%20Certa/mesa-certa/node_modules/vite/dist/node/chunks/node.js:34863:153)
    at async CAC.<anonymous> (file:///C:/Users/Renan/Downloads/TirdMind/Mesa%20Certa/mesa-certa/node_modules/vite/dist/node/cli.js:780:3) {
  errors: [Getter/Setter]
}

exit=1
```

## node src/lib/networking/engine.test.mjs
```text
Cenario real: 76 convidados, 14 mesas, 14 rodadas, 7 por mesa

  ok   a grade tem uma linha por participante
  ok   cada linha tem uma mesa por rodada
  ok   todo participante visita as 14 mesas, sem repetir nenhuma
  ok   lotacao por mesa fica entre floor e ceil de P/T (5–6)
  ok   nenhuma mesa estoura a capacidade
  ok   ninguem reencontra a mesma pessoa na MESMA mesa
  ok   nenhuma dupla se encontra mais de 2 vezes
  ok   a mesma seed reproduz a mesma grade
  ok   reanalisar a grade da os mesmos numeros

  seed escolhida:            1
  tempo de geracao:          225ms
  duplas que se encontram:   2034 de 2850 possiveis (71.4%)
  encontram-se so uma vez:   1688
  reencontros:               346
  contatos por pessoa:       53.5

Motor portado preserva as garantias do cenario real.

exit=0
```
