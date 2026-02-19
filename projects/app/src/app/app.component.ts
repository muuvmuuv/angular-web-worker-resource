import {
	ChangeDetectionStrategy,
	Component,
} from "@angular/core"
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router"

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [RouterOutlet, RouterLink, RouterLinkActive],
})
export class AppComponent {

}
