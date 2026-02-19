import { ChangeDetectionStrategy, Component } from "@angular/core"

import { HomeFeature } from "./features/home/home.component"

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [HomeFeature],
})
export class AppComponent {}
