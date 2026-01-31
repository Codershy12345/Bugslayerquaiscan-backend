import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const app = express();
app.use(cors());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const QUAI_API = "https://api.quaiscan.io/api";

// Latest block number
async function getLatestBlock() {
  const res = await axios.get(QUAI_API, {
    params: {
      module: "proxy",
      action: "eth_blockNumber"
    }
  });
  return parseInt(res.data.result, 16);
}

// Block save
async function saveBlock(blockNumber) {
  const res = await axios.get(QUAI_API, {
    params: {
      module: "proxy",
      action: "eth_getBlockByNumber",
      tag: "0x" + blockNumber.toString(16),
      boolean: true
    }
  });

  const block = res.data.result;
  if (!block) return;

  await supabase.from("blocks").insert({
    block_number: parseInt(block.number, 16),
    block_hash: block.hash,
    timestamp: parseInt(block.timestamp, 16),
    tx_count: block.transactions.length,
    miner: block.miner
  });
}

// API: sync
app.get("/sync", async (req, res) => {
  const latest = await getLatestBlock();
  await saveBlock(latest);
  res.send("✅ Latest block saved");
});

// API: fetch blocks
app.get("/blocks", async (req, res) => {
  const { data } = await supabase
    .from("blocks")
    .select("*")
    .order("block_number", { ascending: false })
    .limit(10);

  res.json(data);
});

// server start
app.listen(5000, () => {
  console.log("🚀 Backend running on http://localhost:5000");
});
