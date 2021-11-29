const { EventEmitter } = require('events');
const { Keyboard } = require('telegram-keyboard');

function TelegrafQuestion() {
    const emitter = new EventEmitter()
    const questions = {}
    const stopSubstrings = new RegExp(['\/'].join("|"))

    return (ctx, next) => {
        ctx.question = async (next, text, updateOldMsg, buttons) => {
            questions[ctx.from.id] = questions[ctx.from.id] ?? {}
            if (updateOldMsg && questions[ctx.from.id].oldId) {
                if (buttons) {
                    var msg = await ctx.telegram.editMessageText(ctx.chat.id, questions[ctx.from.id].oldId, undefined, text, Keyboard.make(buttons).inline());
                } else {
                    var msg = await ctx.telegram.editMessageText(ctx.chat.id, questions[ctx.from.id].oldId, undefined, text);
                }
            } else {
                if (buttons) {
                    var msg = await ctx.reply(text, Keyboard.make(buttons).inline());
                } else {
                    var msg = await ctx.reply(text);
                }
            }

            questions[ctx.from.id].id = msg.message_id

            return new Promise((resolve) => {
                emitter.on(ctx.from.id, (msg) => {
                    questions[ctx.from.id].oldId = questions[ctx.from.id].id;
                    questions[ctx.from.id].id = null;
                    emitter.removeAllListeners(ctx.from.id);
                    if (stopSubstrings.test(msg?.message?.text)) return next();
                    resolve(msg?.message?.text ?? msg?.callback_query?.data);

                })
            })
        }
        if (questions[ctx.from.id]?.id) {
            if (ctx.update.callback_query) {
                if (questions[ctx.from.id].id === ctx.update.callback_query.message.message_id) {
                    emitter.emit(ctx.from.id, ctx.update);
                }
            } else {
                emitter.emit(ctx.from.id, ctx.update);
            }
        }

        next()
    }
}

module.exports = TelegrafQuestion
