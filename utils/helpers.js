exports.toRadian = (distance, unit) => {
    return unit === "mi" ? distance / 3963.2 : distance / 6378.1;
}