<!doctype html>
<html lang="en">
  <head>
    <title>Archiwum KP - Uczestnicy</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
    <link rel="stylesheet" href="css/bootstrap.min.css">
    <link rel="stylesheet" href="style1.css">
  </head>
  <body>
      <?php
         include("nav.php");
         include("conn.php");
      ?>

      <section>
        <div id="tabela">
          <table>
            <th>Uczestnik</th>
            <th>Prowadzone państwa</th>
            <?php
              $query = "SELECT * FROM uczestnicy ORDER BY nick";
              $result = mysqli_query($conn,$query);
              foreach($result as $row)
              {
            ?>
              <tr>
                <td>
                  <a href="uczestnicy_szczegoly.php?id=<?php echo $row['id'];?>"><?php echo $row['nick'];?></a>
                </td>
                <td>
                <?php
                  $idosoba = $row['id'];
                  $query2 = "SELECT DISTINCT uczestnicy.nick, panstwa.nazwa, panstwa.id FROM piosenkaudzial INNER JOIN uczestnicy ON uczestnicy.id=piosenkaudzial.iduczestnika INNER JOIN panstwa ON panstwa.id=piosenkaudzial.idpanstwa WHERE uczestnicy.id=$idosoba ORDER BY iduczestnika,idedycji DESC";
                  $result2 = mysqli_query($conn,$query2);

                  $i=1;
                  $len=mysqli_num_rows($result2);
                  foreach($result2 as $row2)
                  { 
                ?>
                  <img width=20px src="img/flags/<?php echo $row2['nazwa'];?>.png" alt="<?php echo $row2['nazwa'];?>">
                  <a href="panstwa_szczegoly.php?id=<?php echo $row2['id'];?>"><?php echo $row2['nazwa'];?></a>
                <?php
                    if($i!==$len)
                    {
                      echo ' - ';
                    }
                    $i++;
                  }
                ?>
                </td>
              </tr>
            <?php
              }
            ?>
          </table>
        </div>
      </section>

      <?php
        mysqli_close($conn);
        include("footer.php");
      ?>

      <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
      <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>
    <script src="js/bootstrap.min.js"></script>
  </body>
</html>