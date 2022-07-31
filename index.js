const HyperDHT = require("@hyperswarm/dht");
const Hyperswarm = require("hyperswarm");
const sodium = require("sodium-universal");

function randInt(max) {
	return Math.floor(Math.random() * max);
}

class Testnet {
	topics = [];

	constructor(topics = 8, nodes, bootstrap, bootstrapper) {
		this.nodes = nodes;
		this.bootstrap = bootstrap;
		this.bootstrapper = bootstrapper;

		while (this.topics.length < topics) {
			const topic = Buffer.allocUnsafe(32);
			sodium.randombytes_buf(topic);
			this.topics.push(topic);
		}
		for (const topic of this.topics) {
			for (let i = 0; i < randInt(this.nodes.length); i++) {
				this.nodes[randInt(this.nodes.length)].join(topic);
			}
		}
	}

	createNode(options = {}) {
		const node = new Hyperswarm({
			bootstrap: this.bootstrap,
			...options,
		});
		this.nodes.push(node);
		return node;
	}

	async destroy() {
		for (const node of this.nodes) {
			await node.destroy();
		}
		await this.bootstrapper.destroy();
	}

	[Symbol.iterator]() {
		return this.nodes[Symbol.iterator]();
	}
}

async function createTestnet(size = 32, topics = 8, options = {}) {
	const swarm = [];
	const host = options.host || "127.0.0.1";
	const port = options.port || 49737;

	const bootstrapper = new HyperDHT({
		ephemeral: false,
		firewalled: false,
		bootstrap: [],
		bind: port,
	});
	await bootstrapper.ready();

	const bootstrap = [{ host, port: bootstrapper.address().port }];

	while (swarm.length < size) {
		const dht = new HyperDHT({
			ephemeral: false,
			firewalled: false,
			bootstrap,
		});
		await dht.ready();
		const node = new Hyperswarm({ dht });
		swarm.push(node);
	}

	const testnet = new Testnet(topics, swarm, bootstrap, bootstrapper);

	return testnet;
}

function main() {
	const swarm = createTestnet(256, 32);
}

module.exports = createTestnet;

main();
