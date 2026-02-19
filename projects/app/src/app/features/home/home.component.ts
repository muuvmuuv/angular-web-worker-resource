import { ChangeDetectionStrategy, Component, signal } from "@angular/core"
import { FormsModule } from "@angular/forms"
import { webWorkerResource } from "angular-web-worker-resource"

@Component({
	selector: "app-feature-home",
	templateUrl: "./home.component.html",
	styleUrl: "./home.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [FormsModule],
})
export class HomeFeature {
	readonly input = signal(40)

	readonly fibonacci = webWorkerResource<number, number>({
		params: () => this.input(),
		worker: () => new Worker(new URL("./fibonacci.worker", import.meta.url)),
		defaultValue: 0,
	})
}
