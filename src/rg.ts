/**
 * Ripgrep stream stuff.
 */
import * as child_process from 'child_process';
import {Stream} from './streams';
import * as opts from './opts';
import rg from '.'; 

export class RipgrepStream extends Stream<string> {
    cmd: child_process.ChildProcessWithoutNullStreams;
    constructor(input: opts.RipgrepOptions) {
        super();
        const {args, execOpts} = opts.parse(input);
        this.cmd = child_process.spawn(rg, args, execOpts);

        this.cmd.stdout.on('data', (data) => {
            if (this.ended) {
                return this.cmd.kill();
            }
            data = data.toString();
            if (input.separator) {
                data = data.split(input.separator);
            }
            this.push(data);
        });
        this.cmd.stderr.on('data', (data) => {
            if (this.ended) {
                return this.cmd.kill();
            }
            this.error(new Error(data.toString()));
        });
        this.cmd.on('close', (code) => {
            if (this.ended) return;
            if (code !== 0) {
                this.error(new Error(`rg exited with code ${code}`));
            }
            this.end();
        });
    }
    override end() {
        this.cmd.kill();
        super.end();
    }
}

export function ripgrep(input: opts.RipgrepOptions) {
    return new RipgrepStream(input);
}
