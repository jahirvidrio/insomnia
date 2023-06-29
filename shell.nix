with import <nixpkgs> { };

mkShell {
  nativeBuildInputs = [
    nodejs-18_x
    electron_23
    stdenv.cc.cc.lib
  ];
  LD_LIBRARY_PATH = "${stdenv.cc.cc.lib}/lib64:$LD_LIBRARY_PATH";
  ELECTRON_OVERRIDE_DIST_PATH = "${electron_23}/bin/";
}
