import { tweened, type TweenedOptions } from 'svelte/motion';
import { interpolate } from 'd3-interpolate';
import { cubicInOut } from 'svelte/easing';
import { onMount } from 'svelte';

type AnimationFn = () => Promise<void>;
type Resolve<T> = (value: T | PromiseLike<T>) => void;

export function animate(fn: AnimationFn) {
	onMount(fn);
}

export function all<T>(...animations: T[]) {
	return Promise.all(animations);
}

export function signal<T>(
	values: T,
	options: TweenedOptions<T> = { duration: 1000, easing: cubicInOut, interpolate }
) {
	const { subscribe, update, set } = tweened<T>(values, options);
	let tasks: AnimationFn[] = [];

	function to(this: ReturnType<typeof signal<T>>, values: Partial<T>, options?: TweenedOptions<T>) {
		if (typeof values === 'object') {
			tasks.push(() => update((prev) => ({ ...prev, ...values }), options));
		} else {
			tasks.push(() => set(values, options));
		}
		return this;
	}

	function sfx(this: ReturnType<typeof signal<T>>, sound: string, { volume = 0.5 } = {}) {
		const audio = new Audio(sound);
		audio.volume = volume;

		tasks.push(async () => {
			audio.play().catch(() => console.error('To play sounds interact with the page.'));
		});

		return this;
	}

	async function then(resolve: Resolve<void>) {
		for (const task of tasks) {
			await task();
		}

		//? clear queue after each iteration
		tasks = [];

		resolve();
	}

	return { subscribe, to, then, sfx };
}
