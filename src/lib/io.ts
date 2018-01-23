'use strict';

import * as fs from 'fs';

import * as mkpath from 'mkpath';
import * as rimraf from 'rimraf';

export function pathExists(filepath: string): Promise<boolean> {
	return new Promise((resolve) => {
		fs.access(filepath, (err) => {
			resolve(!err);
		});
	});
}

export function statFile(filepath: string): Promise<fs.Stats> {
	return new Promise((resolve, reject) => {
		fs.stat(filepath, (err, stats) => {
			if (err) {
				return reject(err);
			}

			resolve(stats);
		});
	});
}

export function makeDirectory(filepath: string): Promise<void> {
	return new Promise((resolve, reject) => {
		mkpath(filepath, (err) => {
			if (err) {
				return reject(err);
			}

			resolve();
		});
	});
}

export function removeFile(filepath: string, options: rimraf.IOptions): Promise<void> {
	return new Promise((resolve, reject) => {
		rimraf(filepath, options, (err) => {
			if (err) {
				return reject(err);
			}

			resolve();
		});
	});
}
