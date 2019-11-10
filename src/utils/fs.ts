'use strict';

import * as fs from 'fs';

import * as mkpath from 'mkpath';
import * as rimraf from 'rimraf';

export function pathExists(filepath: string): Promise<boolean> {
	return new Promise((resolve) => {
		fs.access(filepath, (error) => resolve(error === null));
	});
}

export function statFile(filepath: string): Promise<fs.Stats> {
	return new Promise((resolve, reject) => {
		fs.stat(filepath, (error, stats) => {
			if (error !== null) {
				return reject(error);
			}

			resolve(stats);
		});
	});
}

export function makeDirectory(filepath: string): Promise<void> {
	return new Promise((resolve, reject) => {
		mkpath(filepath, (error) => {
			if (error !== null) {
				return reject(error);
			}

			resolve();
		});
	});
}

export function removeFile(filepath: string, options: rimraf.Options): Promise<void> {
	return new Promise((resolve, reject) => {
		rimraf(filepath, options, (error) => {
			if (error !== null) {
				return reject(error);
			}

			resolve();
		});
	});
}
