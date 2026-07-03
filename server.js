require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json({
    limit: "5mb"
}));

app.use(express.text({
    type: "*/*",
    limit: "5mb"
}));

app.use(express.static(path.join(__dirname, "public")));

const supabase = createClient(

    process.env.SUPABASE_URL,

    process.env.SUPABASE_ANON_KEY

);

//---------------------------------------------
// MT5から利益保存
//---------------------------------------------

app.post("/api/trade", async (req, res) => {

    try {

        const trade = {

            ticket: Number(req.body.ticket || 0),

            symbol: req.body.symbol || "UNKNOWN",

            lots: Number(req.body.lots || req.body.volume || 0),

            profit: Number(req.body.profit || 0),

            time: req.body.time || new Date().toISOString()

        };

        const { error } = await supabase

            .from("trades")

            .insert([trade]);

        if (error) throw error;

        res.json({

            success: true,
            trade

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});
//---------------------------------------------
// 利益取得
//---------------------------------------------

app.get("/api/trades", async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("trades")
            .select("*")
            .order("time", { ascending: true });

        if (error) throw error;

        const fixed = data.map(t => ({
    ...t,
    time: t.time ? t.time.substring(0, 19) : t.time
}));

res.json(fixed);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

//---------------------------------------------
// 重複チェック（同じticketなら保存しない）
//---------------------------------------------

app.post("/api/trade-safe", async (req, res) => {

    try {

        const ticket = Number(req.body.ticket || 0);

        const { data } = await supabase

            .from("trades")

            .select("id")

            .eq("ticket", ticket)

            .limit(1);

        if (data && data.length > 0) {

            return res.json({

                success: true,

                duplicate: true

            });

        }

        const trade = {

            ticket: ticket,

            symbol: req.body.symbol || "UNKNOWN",

            lots: Number(req.body.lots || req.body.volume || 0),

            profit: Number(req.body.profit || 0),

            time: req.body.time || new Date().toISOString()

        };

        const { error } = await supabase

            .from("trades")

            .insert([trade]);

        if (error) throw error;

        res.json({

            success: true,

            duplicate: false,

            trade

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});
//---------------------------------------------
// トップページ
//---------------------------------------------

app.get("/", (req, res) => {

    res.sendFile(path.join(__dirname, "public", "index.html"));

});

//---------------------------------------------
// サーバー起動
//---------------------------------------------

app.listen(PORT, () => {

    console.log("");
    console.log("======================================");
    console.log(" ProfitCalendar Server Started");
    console.log("======================================");
    console.log("URL : http://localhost:" + PORT);
    console.log("======================================");
    console.log("");

});