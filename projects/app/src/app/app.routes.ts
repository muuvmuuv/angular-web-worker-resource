import type { Routes } from "@angular/router"

export const routes = [
	{
		path: "",
		redirectTo: "home",
		pathMatch: "full",
	},
	{
		path: "home",
		title: "Home",
		loadComponent: () =>
			import("./features/home/home.component").then((m) => m.HomeFeature),
	},
] satisfies Routes
