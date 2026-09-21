/**
 * matrix3.js
 *
 * Utility untuk operasi Matrix 3x3
 *
 * Format matrix:
 *
 * | m0 m3 m6 |
 * | m1 m4 m7 |
 * | m2 m5 m8 |
 *
 * Menggunakan column-major order
 */

const Matrix3 = {

    /**
     * Identity Matrix
     */
    identity: function () {

        return new Float32Array([
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ]);

    },


    /**
     * Translation Matrix
     */
    translation: function (tx, ty) {

        return new Float32Array([

            1, 0, 0,

            0, 1, 0,

            tx, ty, 1

        ]);

    },


    /**
     * Rotation Matrix
     *
     * angle dalam radians
     */
    rotation: function (angle) {

        const c = Math.cos(angle);
        const s = Math.sin(angle);

        return new Float32Array([

             c, s, 0,

            -s, c, 0,

             0, 0, 1

        ]);

    },


    /**
     * Scaling Matrix
     */
    scaling: function (sx, sy) {

        return new Float32Array([

            sx, 0, 0,

            0, sy, 0,

            0, 0, 1

        ]);

    },


    /**
     * Matrix Multiplication
     *
     * result = a * b
     */
    multiply: function (a, b) {

        const result = new Float32Array(9);

        for (let column = 0; column < 3; column++) {

            for (let row = 0; row < 3; row++) {

                result[column * 3 + row] =

                    a[0 * 3 + row] * b[column * 3 + 0] +

                    a[1 * 3 + row] * b[column * 3 + 1] +

                    a[2 * 3 + row] * b[column * 3 + 2];

            }

        }

        return result;

    },


    /**
     * Gabungkan beberapa matrix
     *
     * Contoh:
     *
     * Matrix3.compose(T, R, S)
     */
    compose: function (...matrices) {

        let result = Matrix3.identity();

        for (const matrix of matrices) {

            result = Matrix3.multiply(result, matrix);

        }

        return result;

    }

};