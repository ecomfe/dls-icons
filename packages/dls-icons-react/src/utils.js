/**
 * @file 工具函数
 * @author zhanglili
 */

export const memoize = fn => {
    const cache = {};

    return n => {
        if (!cache[n]) {
            cache[n] = fn(n);
        }

        return cache[n];
    };
};

export const merge = (x, y) => {
    if (!x) {
        return y;
    }

    if (!y) {
        return x;
    }

    return {...x, ...y};
};
