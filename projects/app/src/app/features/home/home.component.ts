import { ChangeDetectionStrategy, Component, signal } from "@angular/core"
import { toObservable, toSignal } from "@angular/core/rxjs-interop"
import { FormsModule } from "@angular/forms"
import { webWorkerResource } from "angular-web-worker-resource"
import { debounceTime } from "rxjs"

@Component({
	selector: "app-feature-home",
	templateUrl: "./home.component.html",
	styleUrl: "./home.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [FormsModule],
})
export class HomeFeature {
	readonly input = signal(40)
	readonly debouncedInput = toSignal(
		toObservable(this.input).pipe(debounceTime(500)),
		{
			initialValue: this.input(),
		},
	)

	readonly fibonacci = webWorkerResource<number, number>({
		params: () => this.debouncedInput(),
		worker: () => new Worker(new URL("./fibonacci.worker", import.meta.url)),
		defaultValue: 0,
	})
}
